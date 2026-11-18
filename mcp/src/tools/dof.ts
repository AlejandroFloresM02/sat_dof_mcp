/** The Spanish terms and examples in the descriptions are deliberate: DOF text is Spanish, so the agent must search and quote in Spanish. */
import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { DofError } from "../dof/client.ts";
import { CHARACTER_LIMIT, DISCLAIMER } from "../dof/constants.ts";
import type { DofContext } from "../dof/context.ts";
import { addDays, daysBetween, eachDate, isIsoDate } from "../dof/dates.ts";
import { INDICATOR_KEYS, INDICATORS, indicatorByCode, indicatorByKey } from "../dof/indicators.ts";
import { foldText, normalizeFoundNote, normalizeIndicators, type ValorIndicador } from "../dof/normalize.ts";

const MAX_RANGE_DAYS = 31;
const MAX_INDICATOR_RANGE_DAYS = 366;
const MAX_SOURCE_URLS = 5;

/** A problem with the arguments that the input schema cannot express. */
class InputError extends Error {}

const IsoDateInput = z
  .string()
  .refine(isIsoDate, { error: "Invalid date: use the format YYYY-MM-DD with a day that exists." });

const Fuente = z.object({
  conjunto: z.literal("dof").describe("Dataset identifier"),
  nombre: z.string(),
  consultas: z.array(z.string()).describe(`DOF addresses that were queried (at most ${MAX_SOURCE_URLS})`),
  total_consultas: z.number().int(),
  consultado_en: z.string().describe("When the DOF was queried, in UTC"),
  fecha_ultima_edicion: z
    .string()
    .optional()
    .describe("Date of the most recent DOF edition at query time. Absent if it could not be determined"),
});

const PageInfo = {
  total_count: z.number().int().describe("Total results that match the query"),
  count: z.number().int().describe("Results in this response"),
  offset: z.number().int(),
  has_more: z.boolean(),
  next_offset: z.number().int().optional().describe("Offset value to request the next page"),
};

const Common = {
  fuente: Fuente,
  aviso: z.string(),
};

const LimitInput = (byDefault: number, max: number) =>
  z.number().int().min(1).max(max).default(byDefault).describe(`Maximum results per response (1 to ${max})`);
const OffsetInput = z.number().int().min(0).default(0).describe("Results to skip, for paging");

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true } as const;

async function buildFuente(ctx: DofContext, urls: readonly string[]): Promise<z.infer<typeof Fuente>> {
  let fechaUltimaEdicion: string | undefined;
  try {
    fechaUltimaEdicion = (await ctx.freshness.latestEdition()).fecha;
  } catch (error) {
    // The data was read; not knowing the latest edition does not invalidate it.
    if (!(error instanceof DofError)) throw error;
  }
  return {
    conjunto: "dof",
    nombre: "Diario Oficial de la Federación (SIDOF)",
    consultas: urls.slice(0, MAX_SOURCE_URLS),
    total_consultas: urls.length,
    consultado_en: ctx.now().toISOString(),
    ...(fechaUltimaEdicion === undefined ? {} : { fecha_ultima_edicion: fechaUltimaEdicion }),
  };
}

interface Page<T> {
  items: T[];
  total_count: number;
  count: number;
  offset: number;
  has_more: boolean;
  next_offset?: number;
}

function pageOf<T>(items: T[], total: number, offset: number): Page<T> {
  const next = offset + items.length;
  const hasMore = next < total;
  return { items, total_count: total, count: items.length, offset, has_more: hasMore, ...(hasMore ? { next_offset: next } : {}) };
}

/** Returns fewer items instead of cutting text, so `next_offset` always points at the first item left out. */
function fit<T, R extends Record<string, unknown>>(
  items: T[],
  total: number,
  offset: number,
  build: (page: Page<T>) => R,
): { content: [{ type: "text"; text: string }]; structuredContent: R } {
  const render = (page: T[]) => {
    const structuredContent = build(pageOf(page, total, offset));
    return { structuredContent, text: JSON.stringify(structuredContent) };
  };

  let page = items;
  let result = render(page);
  while (result.text.length > CHARACTER_LIMIT && page.length > 1) {
    page = page.slice(0, Math.ceil(page.length / 2));
    result = render(page);
  }
  return { content: [{ type: "text", text: result.text }], structuredContent: result.structuredContent };
}

function pageFields<T>(page: Page<T>): Omit<Page<T>, "items"> {
  const { items: _items, ...fields } = page;
  return fields;
}

/** An unexpected error is logged and replaced, so internals do not reach the model. */
async function guarded<R>(tool: string, run: () => Promise<R>): Promise<R> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof DofError || error instanceof InputError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    console.error(`[${tool}] unexpected error:`, error);
    throw new Error("Internal error while processing the DOF response. Try again; if it persists, report it.");
  }
}

export const EstadoOutput = z.object({
  hoy_cdmx: z.string().describe("Today's date in Mexico City"),
  ultima_edicion: z.object({
    fecha: z.string().describe("Date of the most recent published edition"),
    ediciones: z.array(
      z.object({
        edicion: z.enum(["MAT", "VES", "EXT"]).describe("MAT matutina (morning), VES vespertina (evening), EXT extraordinaria (special)"),
        cod_diario: z.number().int(),
        paginas: z.number().int().optional(),
        secciones: z.array(z.string()),
      }),
    ),
    dias_revisados: z.number().int().describe("Days checked going back, counting today, until an edition was found"),
  }),
  indicadores: z.array(
    z.object({
      codigo: z.number().int(),
      indicador: z.string(),
      nombre: z.string(),
      unidad: z.string(),
      fecha_mas_reciente: z.string().describe("Latest date, today or earlier, with a published value"),
      valor: z.number().nullable(),
      valor_original: z.string(),
      publicado_hasta: z.string().optional().describe("Latest future date already published, if the indicator is published ahead of time"),
    }),
  ),
  indicadores_sin_valores_recientes: z.array(z.string()).describe("Indicators the DOF stopped publishing"),
  nota: z.string(),
  ...Common,
});

export const PublicacionesOutput = z.object({
  fecha_desde: z.string(),
  fecha_hasta: z.string(),
  ...PageInfo,
  publicaciones: z.array(
    z.object({
      cod_nota: z.number().int(),
      titulo: z.string(),
      fecha: z.string(),
      edicion: z.enum(["MAT", "VES", "EXT"]),
      cod_diario: z.number().int(),
      pagina: z.number().int().optional(),
      organismo: z.string().optional().describe("Issuing branch of government or body (poder u órgano emisor)"),
      dependencia: z.string().optional().describe("Issuing agency (dependencia)"),
      tipo: z.enum(["nota", "aviso"]).describe("aviso: judicial and general notices (avisos judiciales y generales)"),
      url: z.string().describe("Public page of the note on dof.gob.mx"),
    }),
  ),
  fechas_sin_edicion: z.array(z.string()).describe("Dates in the range for which the DOF has no notes"),
  encabezados_omitidos: z.number().int().describe("Notes without a title (group headings) that are left out"),
  ...Common,
});

export const BuscarOutput = z.object({
  texto: z.string(),
  ...PageInfo,
  notas: z.array(
    z.object({
      cod_nota: z.number().int(),
      titulo: z.string(),
      fecha: z.string(),
      cod_diario: z.number().int(),
      organismo: z.string().optional(),
      dependencia: z.string().optional(),
      url: z.string(),
    }),
  ),
  ...Common,
});

export const IndicadoresOutput = z.object({
  modo: z.enum(["ultimo_valor", "fecha", "rango"]),
  ...PageInfo,
  valores: z.array(
    z.object({
      codigo: z.number().int(),
      indicador: z.string().optional(),
      nombre: z.string(),
      unidad: z.string().optional(),
      fecha: z.string(),
      valor: z.number().nullable().describe("null if the DOF published text that is not a number; see valor_original"),
      valor_original: z.string().describe("The value exactly as the DOF published it"),
      duplicado: z.literal(true).optional().describe("The DOF has more than one value for this indicator and date"),
      publicado_hasta: z.string().optional().describe("Latest future date already published"),
    }),
  ),
  nota: z.string().optional(),
  ...Common,
});

export function registerDofTools(server: McpServer, ctx: DofContext): void {
  server.registerTool(
    "dof_estado",
    {
      title: "DOF status",
      description: `Reports the date up to which the Diario Oficial de la Federación (DOF, Mexico's official gazette) has data right now.

Returns the date of the most recent edition with its editions (matutina, vespertina, extraordinaria) and, for each indicator (dólar FIX, UDI, TIIE, CCP), the latest date with a published value.

Use it to answer "has today's DOF come out?", "what is the latest edition?" or "how current is the data?", and before stating that something has not been published. If there is no edition yet today, ultima_edicion.fecha is an earlier day. The edición vespertina can appear later the same day.`,
      inputSchema: z.strictObject({}),
      outputSchema: EstadoOutput,
      annotations: READ_ONLY,
    },
    () =>
      guarded("dof_estado", async () => {
        const [edicion, estado] = await Promise.all([ctx.freshness.latestEdition(), ctx.freshness.latestIndicators()]);
        const structuredContent = EstadoOutput.parse({
          hoy_cdmx: edicion.hoy_cdmx,
          ultima_edicion: { fecha: edicion.fecha, ediciones: edicion.ediciones, dias_revisados: edicion.dias_revisados },
          indicadores: estado.indicadores,
          indicadores_sin_valores_recientes: estado.sin_valores_recientes,
          nota: "The DOF publishes no update date. These dates come from querying the service day by day; consultado_en says when that was done.",
          fuente: await buildFuente(ctx, [edicion.url]),
          aviso: DISCLAIMER,
        });
        return { content: [{ type: "text", text: JSON.stringify(structuredContent) }], structuredContent };
      }),
  );

  server.registerTool(
    "dof_publicaciones",
    {
      title: "DOF publications by date",
      description: `Lists the notes published in the Diario Oficial de la Federación (DOF) on one date or over a range of up to ${MAX_RANGE_DAYS} days, newest first. A note (nota) is one published item.

Without dates, it returns the notes of the most recent edition. Each note has its code, title, date, edition, page, issuer and link. Results can be filtered by edition, by issuer and by title text. Titles and issuer names are in Spanish, so the organismo and texto filters take Spanish text.

fechas_sin_edicion lists the days in the range with no publication (weekends, public holidays, or today if the edition is not out yet). An empty publicaciones list with filters does not mean there was no DOF: check total_count and fechas_sin_edicion.

To search titles across any year use dof_buscar_notas. To find the latest edition use dof_estado.`,
      inputSchema: z.strictObject({
        fecha_desde: IsoDateInput.optional().describe("First date, YYYY-MM-DD. If omitted, the date of the most recent edition is used"),
        fecha_hasta: IsoDateInput.optional().describe("Last date, YYYY-MM-DD, inclusive. If omitted, it equals fecha_desde"),
        edicion: z.enum(["MAT", "VES", "EXT"]).optional().describe("Only this edition: MAT matutina (morning), VES vespertina (evening), EXT extraordinaria (special)"),
        organismo: z.string().min(2).max(100).optional().describe("Issuer text in Spanish, ignoring accents and case, e.g. 'hacienda'"),
        texto: z.string().min(2).max(200).optional().describe("Spanish text that must appear in the title, ignoring accents and case"),
        limit: LimitInput(50, 200),
        offset: OffsetInput,
      }),
      outputSchema: PublicacionesOutput,
      annotations: READ_ONLY,
    },
    (input) =>
      guarded("dof_publicaciones", async () => {
        const today = ctx.today();
        if (input.fecha_desde === undefined && input.fecha_hasta !== undefined) {
          throw new InputError("fecha_hasta needs fecha_desde. Send both, or neither to see the most recent edition.");
        }
        const desde = input.fecha_desde ?? (await ctx.freshness.latestEdition()).fecha;
        const hasta = input.fecha_hasta ?? desde;
        if (hasta < desde) throw new InputError(`fecha_hasta (${hasta}) is earlier than fecha_desde (${desde}). Swap them.`);
        if (hasta > today) {
          throw new InputError(`The range ends after today (${today}). The DOF has no notes for future dates: use ${today} as the latest date.`);
        }
        if (daysBetween(desde, hasta) >= MAX_RANGE_DAYS) {
          const suggested = addDays(desde, MAX_RANGE_DAYS - 1);
          throw new InputError(`The maximum range is ${MAX_RANGE_DAYS} days. Ask for ${desde} to ${suggested}, then continue from ${addDays(suggested, 1)}.`);
        }

        const days = await Promise.all(eachDate(desde, hasta).reverse().map((date) => ctx.dayNotes(date)));
        const organismo = input.organismo === undefined ? undefined : foldText(input.organismo);
        const texto = input.texto === undefined ? undefined : foldText(input.texto);
        const matching = days
          .flatMap((day) => day.publicaciones)
          .filter(
            (nota) =>
              (input.edicion === undefined || nota.edicion === input.edicion) &&
              (organismo === undefined || foldText(`${nota.organismo ?? ""} ${nota.dependencia ?? ""}`).includes(organismo)) &&
              (texto === undefined || foldText(nota.titulo).includes(texto)),
          );
        const fuente = await buildFuente(ctx, days.map((day) => day.url));

        return fit(matching.slice(input.offset, input.offset + input.limit), matching.length, input.offset, (page) =>
          PublicacionesOutput.parse({
            fecha_desde: desde,
            fecha_hasta: hasta,
            ...pageFields(page),
            publicaciones: page.items,
            fechas_sin_edicion: days
              .filter((day) => day.publicaciones.length === 0 && day.encabezados_omitidos === 0)
              .map((day) => day.fecha)
              .sort(),
            encabezados_omitidos: days.reduce((sum, day) => sum + day.encabezados_omitidos, 0),
            fuente,
            aviso: DISCLAIMER,
          }),
        );
      }),
  );

  server.registerTool(
    "dof_buscar_notas",
    {
      title: "Search DOF notes by title",
      description: `Searches for notes in the Diario Oficial de la Federación (DOF) whose title contains a text, across all available years (since 1917). Titles are in Spanish, so search with Spanish text. Accents and case are ignored.

It searches the title only, not the body of the note. Returns code, title, date, issuer and link, newest first unless asked otherwise, with the total number of matches.

To see everything published on a date use dof_publicaciones. This search uses a DOF route that is not in its official documentation; if it fails, use dof_publicaciones with the texto filter.`,
      inputSchema: z.strictObject({
        texto: z.string().trim().min(3).max(200).describe("Spanish text to search for in the title, e.g. 'resolución miscelánea fiscal'"),
        orden: z.enum(["recientes", "antiguas"]).default("recientes").describe("recientes: newest first; antiguas: oldest first"),
        limit: LimitInput(20, 50),
        offset: OffsetInput,
      }),
      outputSchema: BuscarOutput,
      annotations: READ_ONLY,
    },
    (input, call) =>
      guarded("dof_buscar_notas", async () => {
        const signal = call.mcpReq.signal;
        const order = input.orden === "recientes" ? "desc" : "asc";
        // The DOF pages by number. An offset that is not a multiple of limit spans two of its pages.
        const firstPage = Math.floor(input.offset / input.limit) + 1;
        const skip = input.offset % input.limit;
        const pages = await Promise.all(
          (skip === 0 ? [firstPage] : [firstPage, firstPage + 1]).map((page) =>
            ctx.client.searchTitles(input.texto, page, input.limit, order, { signal }),
          ),
        );
        const total = pages[0]?.data.totalRegistros ?? 0;
        const found = pages
          .flatMap((page) => page.data.Notas)
          .slice(skip, skip + input.limit)
          .map(normalizeFoundNote);
        const fuente = await buildFuente(ctx, pages.map((page) => page.url));

        return fit(found, total, input.offset, (page) =>
          BuscarOutput.parse({ texto: input.texto, ...pageFields(page), notas: page.items, fuente, aviso: DISCLAIMER }),
        );
      }),
  );

  const indicatorList = INDICATORS.map((info) => `${info.key} (${info.code}, ${info.name})`).join("; ");

  server.registerTool(
    "dof_indicadores",
    {
      title: "DOF indicators",
      description: `Returns the indicators that the Banco de México publishes in the Diario Oficial de la Federación (DOF): the dollar exchange rate (tipo de cambio FIX), the UDI, the TIIE and the funding costs (costos de captación).

Three ways to use it:
- Without dates: the latest published value of each indicator, or of the one requested.
- With fecha: the values for that day.
- With fecha_desde (and optionally fecha_hasta): the series of one indicator, in date order, up to ${MAX_INDICATOR_RANGE_DAYS} days per call.

The exchange rate and the TIIE carry the date they were published in the DOF; the UDI carries the date it applies to and is published ahead of time. On weekends and public holidays there is only the UDI. valor is the number; valor_original is the published text.

Indicators: ${indicatorList}.`,
      inputSchema: z.strictObject({
        indicador: z
          .union([z.enum(INDICATOR_KEYS), z.number().int().positive()])
          .optional()
          .describe("Indicator key (e.g. 'dolar_fix', 'udi', 'tiie_28') or its numeric code in the DOF"),
        fecha: IsoDateInput.optional().describe("A single day, YYYY-MM-DD. Cannot be combined with fecha_desde or fecha_hasta"),
        fecha_desde: IsoDateInput.optional().describe("Start of the series, YYYY-MM-DD. Requires indicador"),
        fecha_hasta: IsoDateInput.optional().describe("End of the series, YYYY-MM-DD, inclusive. If omitted, it is today"),
        limit: LimitInput(50, 500),
        offset: OffsetInput,
      }),
      outputSchema: IndicadoresOutput,
      annotations: READ_ONLY,
    },
    (input, call) =>
      guarded("dof_indicadores", async () => {
        const signal = call.mcpReq.signal;
        const code =
          input.indicador === undefined
            ? undefined
            : typeof input.indicador === "number"
              ? input.indicador
              : indicatorByKey(input.indicador)?.code;
        if (input.fecha !== undefined && (input.fecha_desde !== undefined || input.fecha_hasta !== undefined)) {
          throw new InputError("Use fecha for a single day, or fecha_desde and fecha_hasta for a series, but not both.");
        }
        if (input.fecha_hasta !== undefined && input.fecha_desde === undefined) {
          throw new InputError("fecha_hasta needs fecha_desde.");
        }

        let modo: z.infer<typeof IndicadoresOutput>["modo"];
        let valores: (ValorIndicador & { publicado_hasta?: string })[];
        let urls: string[] = [];
        let nota: string | undefined;

        if (input.fecha_desde !== undefined) {
          modo = "rango";
          if (code === undefined) {
            throw new InputError("A series needs indicador. Say which one, for example 'dolar_fix'.");
          }
          const hasta = input.fecha_hasta ?? ctx.today();
          if (hasta < input.fecha_desde) {
            throw new InputError(`fecha_hasta (${hasta}) is earlier than fecha_desde (${input.fecha_desde}). Swap them.`);
          }
          if (daysBetween(input.fecha_desde, hasta) >= MAX_INDICATOR_RANGE_DAYS) {
            const suggested = addDays(input.fecha_desde, MAX_INDICATOR_RANGE_DAYS - 1);
            throw new InputError(`The maximum range is ${MAX_INDICATOR_RANGE_DAYS} days. Ask for ${input.fecha_desde} to ${suggested}, then continue from ${addDays(suggested, 1)}.`);
          }
          try {
            const { url, data } = await ctx.client.indicatorRange(code, input.fecha_desde, hasta, { signal });
            valores = normalizeIndicators(data.ListaIndicadores);
            urls = [url];
          } catch (error) {
            if (!(error instanceof DofError && error.kind === "no_data")) throw error;
            valores = [];
            urls = [error.url];
            nota =
              indicatorByCode(code) === undefined
                ? `The DOF has no values for code ${code} in that range. The code may not exist; the known ones are in the tool description.`
                : "The DOF has no values for this indicator in that range.";
          }
        } else if (input.fecha !== undefined) {
          modo = "fecha";
          try {
            const { url, data } = await ctx.client.indicatorsByDate(input.fecha, { signal });
            valores = normalizeIndicators(data.ListaIndicadores).filter((valor) => code === undefined || valor.codigo === code);
            urls = [url];
            if (valores.length === 0) nota = "The DOF has indicators on that date, but not the one requested. On weekends and public holidays it publishes only the UDI.";
          } catch (error) {
            if (!(error instanceof DofError && error.kind === "no_data")) throw error;
            valores = [];
            urls = [error.url];
            nota = "The DOF has no indicators published for that date. Call without dates to see the latest value of each indicator.";
          }
        } else {
          modo = "ultimo_valor";
          const estado = await ctx.freshness.latestIndicators();
          valores = estado.indicadores
            .filter((item) => code === undefined || item.codigo === code)
            .map(({ fecha_mas_reciente, ...item }) => ({ ...item, fecha: fecha_mas_reciente }));
          if (valores.length === 0) {
            nota = `The DOF published no values for this indicator between ${estado.ventana_desde} and ${estado.ventana_hasta}. Request a series with fecha_desde to see its history.`;
          }
        }

        const fuente = await buildFuente(ctx, urls);
        return fit(valores.slice(input.offset, input.offset + input.limit), valores.length, input.offset, (page) =>
          IndicadoresOutput.parse({
            modo,
            ...pageFields(page),
            valores: page.items,
            ...(nota === undefined ? {} : { nota }),
            fuente,
            aviso: DISCLAIMER,
          }),
        );
      }),
  );
}
