import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { CHARACTER_LIMIT, DISCLAIMER } from "../src/dof/constants.ts";
import { DofContext } from "../src/dof/context.ts";
import { addDays } from "../src/dof/dates.ts";
import { createServer } from "../src/server.ts";
import { alwaysFetch, clockAt, entry, fixtureFetch, json, scenario, type FixtureFetch } from "./helpers/fixtures.ts";

const TOOLS = ["dof_buscar_notas", "dof_estado", "dof_indicadores", "dof_publicaciones"];
const lastDay = scenario.dias.length - 1;

let fetch: FixtureFetch;
let client: Client;
let close: () => Promise<void>;

async function connect(context: DofContext): Promise<void> {
  const handler = createMcpHandler(() => createServer(context));
  const transport = new StreamableHTTPClientTransport(new URL("http://test.local/mcp"), {
    fetch: (url, init) => handler.fetch(new Request(String(url), init as RequestInit)),
  });
  client = new Client({ name: "test", version: "1.0.0" }, { versionNegotiation: { mode: "auto" } });
  await client.connect(transport);
  close = async () => {
    await client.close();
    await handler.close();
  };
}

beforeEach(async () => {
  fetch = fixtureFetch();
  await connect(new DofContext({ fetch, now: clockAt(scenario.hoy) }));
});

afterEach(async () => {
  await close();
  // Every request a tool made must be one the fixtures cover.
  expect(fetch.missing).toEqual([]);
});

async function call(name: string, args: Record<string, unknown> = {}): Promise<any> {
  const result = await client.callTool({ name, arguments: args });
  if (result.isError) throw new Error(`${name} failed: ${JSON.stringify(result.content)}`);
  const text = (result.content as { type: string; text: string }[])[0]!.text;
  expect(JSON.parse(text)).toEqual(result.structuredContent);
  expect(text.length).toBeLessThanOrEqual(CHARACTER_LIMIT);
  return result.structuredContent;
}

async function errorOf(name: string, args: Record<string, unknown>): Promise<string> {
  const result = await client.callTool({ name, arguments: args });
  expect(result.isError).toBe(true);
  return (result.content as { type: string; text: string }[])[0]!.text;
}

async function titledNotes(): Promise<any[]> {
  const raw = await json(`notas_hoy_menos_${lastDay}`);
  return [...raw.NotasMatutinas, ...raw.NotasVespertinas, ...raw.NotasExtraordinarias].filter((note) => note.titulo);
}

describe("protocol", () => {
  test("lists the four tools, read-only, with typed input and output", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual(TOOLS);
    for (const tool of tools) {
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.inputSchema.type).toBe("object");
      expect(tool.outputSchema?.type).toBe("object");
      expect(tool.description?.length).toBeGreaterThan(80);
    }
  });

  test("sends instructions for answering users who ask in Spanish", () => {
    expect(client.getInstructions()).toContain("Spanish");
  });

  test("unknown arguments are rejected", async () => {
    expect(await errorOf("dof_estado", { fecha: scenario.hoy })).toContain("Input validation error");
  });

  test("every response carries the source and the disclaimer", async () => {
    const calls: [string, Record<string, unknown>][] = [
      ["dof_estado", {}],
      ["dof_publicaciones", {}],
      ["dof_buscar_notas", { texto: scenario.busqueda_texto, limit: scenario.busqueda_limite }],
      ["dof_indicadores", {}],
    ];
    for (const [name, args] of calls) {
      const output = await call(name, args);
      expect(output.aviso).toBe(DISCLAIMER);
      expect(output.fuente.conjunto).toBe("dof");
      expect(output.fuente.fecha_ultima_edicion).toBe(scenario.ultima_edicion);
      expect(output.fuente.consultado_en).toBe(clockAt(scenario.hoy)().toISOString());
    }
  });
});

describe("dof_estado", () => {
  test("reports the latest edition, not today, when today has none", async () => {
    const output = await call("dof_estado");
    expect(output.hoy_cdmx).toBe(scenario.hoy);
    expect(output.ultima_edicion.fecha).toBe(scenario.ultima_edicion);
    expect(output.ultima_edicion.dias_revisados).toBe(scenario.dias.length);
    expect(output.ultima_edicion.ediciones.length).toBeGreaterThan(0);
    expect(output.indicadores.length).toBeGreaterThan(0);
  });

  test("an outage is an error that says so, not an old date", async () => {
    await close();
    await connect(new DofContext({ fetch: alwaysFetch("notas_fecha_imposible"), now: clockAt(scenario.hoy) }));
    expect(await errorOf("dof_estado", {})).toContain("error 500");
  });
});

describe("dof_publicaciones", () => {
  test("without dates returns the latest edition", async () => {
    const titled = await titledNotes();
    const output = await call("dof_publicaciones", { limit: 200 });
    expect(output.fecha_desde).toBe(scenario.ultima_edicion);
    expect(output.fecha_hasta).toBe(scenario.ultima_edicion);
    expect(output.total_count).toBe(titled.length);
    expect(output.fechas_sin_edicion).toEqual([]);
    expect(output.publicaciones.every((nota: any) => nota.url.includes(String(nota.cod_nota)))).toBe(true);
  });

  test("paging visits every note exactly once", async () => {
    const titled = await titledNotes();
    const seen: number[] = [];
    let offset: number | undefined = 0;
    while (offset !== undefined) {
      const page: any = await call("dof_publicaciones", { limit: 7, offset });
      seen.push(...page.publicaciones.map((nota: any) => nota.cod_nota));
      expect(page.count).toBe(page.publicaciones.length);
      expect(page.has_more).toBe(page.next_offset !== undefined);
      offset = page.next_offset;
    }
    expect(seen.toSorted()).toEqual(titled.map((note) => note.codNota).toSorted());
    expect(fetch.calls.filter((url) => url === entry(`notas_hoy_menos_${lastDay}`).url)).toHaveLength(1);
  });

  test("a range names the days without an edition", async () => {
    const output = await call("dof_publicaciones", { fecha_desde: scenario.ultima_edicion, fecha_hasta: scenario.hoy, limit: 1 });
    expect(output.fechas_sin_edicion).toEqual(scenario.dias.filter((date) => date !== scenario.ultima_edicion).toSorted());
    expect(output.total_count).toBe((await titledNotes()).length);
  });

  test("a day without an edition is an empty list that says why, not an error", async () => {
    const output = await call("dof_publicaciones", { fecha_desde: scenario.hoy });
    expect(output.total_count).toBe(0);
    expect(output.fechas_sin_edicion).toEqual([scenario.hoy]);
  });

  test("filters narrow the list and ignore accents and case", async () => {
    const titled = await titledNotes();
    const sample = titled.find((note) => typeof note.codOrgaDos === "string")!;
    const byIssuer = await call("dof_publicaciones", { organismo: sample.codOrgaDos.toLowerCase(), limit: 200 });
    expect(byIssuer.total_count).toBe(titled.filter((note) => note.codOrgaDos === sample.codOrgaDos).length);

    const word = (sample.titulo as string).split(/\s+/)[0]!;
    const byText = await call("dof_publicaciones", { texto: word.toUpperCase(), limit: 200 });
    expect(byText.total_count).toBeGreaterThan(0);
    expect(byText.total_count).toBeLessThanOrEqual(titled.length);
    expect(byText.publicaciones.every((nota: any) => nota.titulo.toLowerCase().includes(word.toLowerCase()))).toBe(true);
  });

  test("long results are shortened by returning fewer notes", async () => {
    const output = await call("dof_publicaciones", { limit: 200 });
    if (output.count < output.total_count) expect(output.next_offset).toBe(output.count);
  });

  test("a day too long for one response is returned in smaller pages, with nothing lost or cut", async () => {
    // The same day, repeated until it cannot fit: every copy of a note gets its own code.
    const raw = await json(`notas_hoy_menos_${lastDay}`);
    const copies = 12;
    const big = {
      ...raw,
      NotasMatutinas: Array.from({ length: copies }, (_, copy) =>
        raw.NotasMatutinas.map((note: any) => ({ ...note, codNota: note.codNota + copy * 1_000_000 })),
      ).flat(),
    };
    const expected = [...big.NotasMatutinas, ...big.NotasVespertinas].filter((note: any) => note.titulo).length;
    expect(JSON.stringify(big).length).toBeGreaterThan(CHARACTER_LIMIT * 4);

    const dayUrl = entry(`notas_hoy_menos_${lastDay}`).url;
    await close();
    await connect(
      new DofContext({ fetch: (url) => (url === dayUrl ? Promise.resolve(Response.json(big)) : fetch(url)), now: clockAt(scenario.hoy) }),
    );

    const seen = new Set<number>();
    let offset: number | undefined = 0;
    let pages = 0;
    while (offset !== undefined) {
      // `call` already checks each response against the character limit.
      const page: any = await call("dof_publicaciones", { limit: 200, offset });
      expect(page.total_count).toBe(expected);
      expect(page.count).toBeLessThan(200);
      expect(page.next_offset).toBe(page.has_more ? offset + page.count : undefined);
      for (const nota of page.publicaciones) seen.add(nota.cod_nota);
      offset = page.next_offset;
      pages++;
    }
    expect(seen.size).toBe(expected);
    expect(pages).toBeGreaterThan(1);
  });

  test("errors say what to change", async () => {
    const tomorrow = addDays(scenario.hoy, 1);
    expect(await errorOf("dof_publicaciones", { fecha_desde: scenario.hoy, fecha_hasta: tomorrow })).toContain(scenario.hoy);
    expect(await errorOf("dof_publicaciones", { fecha_desde: scenario.hoy, fecha_hasta: scenario.ultima_edicion })).toContain("earlier");
    expect(await errorOf("dof_publicaciones", { fecha_desde: addDays(scenario.hoy, -400), fecha_hasta: scenario.hoy })).toContain("maximum");
    expect(await errorOf("dof_publicaciones", { fecha_hasta: scenario.hoy })).toContain("fecha_desde");
    expect(await errorOf("dof_publicaciones", { fecha_desde: `${scenario.hoy.slice(0, 4)}-02-31` })).toContain("YYYY-MM-DD");
    expect(fetch.calls).toEqual([]);
  });
});

describe("dof_buscar_notas", () => {
  test("returns the page and the total the DOF reports", async () => {
    const raw = await json("buscar_titulo");
    const output = await call("dof_buscar_notas", { texto: scenario.busqueda_texto, limit: scenario.busqueda_limite });
    expect(output.total_count).toBe(raw.totalRegistros);
    expect(output.notas.map((nota: any) => nota.cod_nota)).toEqual(raw.Notas.map((note: any) => note.codNota));
    expect(output.has_more).toBe(raw.totalRegistros > raw.Notas.length);
    expect(output.next_offset).toBe(raw.Notas.length);
    expect(output.notas.every((nota: any) => /^\d{4}-\d{2}-\d{2}$/.test(nota.fecha))).toBe(true);
  });

  test("no matches is an empty result, not an error", async () => {
    await close();
    await connect(new DofContext({ fetch: alwaysFetch("buscar_titulo_sin_resultados"), now: clockAt(scenario.hoy) }));
    const output = await call("dof_buscar_notas", { texto: scenario.busqueda_texto });
    expect(output).toMatchObject({ total_count: 0, count: 0, has_more: false, notas: [] });
  });

  test("any offset works, although the DOF only pages by number", async () => {
    // A stand-in for the search route: it serves slices of one ordered list, as the DOF does.
    const sample = (await json("buscar_titulo")).Notas[0];
    const all = Array.from({ length: 10 }, (_, index) => ({ ...sample, codNota: sample.codNota + index }));
    const requested: string[] = [];
    const search = async (url: string) => {
      requested.push(url);
      const [page, size, , order] = url.split("/").slice(-4);
      const ordered = order === "asc" ? all.toReversed() : all;
      const start = (Number(page) - 1) * Number(size);
      return Response.json({ messageCode: 200, response: "OK", totalRegistros: all.length, Notas: ordered.slice(start, start + Number(size)) });
    };
    await close();
    await connect(new DofContext({ fetch: (url) => (url.includes("/buscarNotas/") ? search(url) : fetch(url)), now: clockAt(scenario.hoy) }));
    const codes = (output: any) => output.notas.map((nota: any) => nota.cod_nota);

    const first = await call("dof_buscar_notas", { texto: scenario.busqueda_texto, limit: 4 });
    const shifted = await call("dof_buscar_notas", { texto: scenario.busqueda_texto, limit: 3, offset: 1 });
    expect(codes(shifted)).toEqual(codes(first).slice(1, 4));
    expect(shifted).toMatchObject({ total_count: all.length, offset: 1, count: 3, has_more: true, next_offset: 4 });

    const last = await call("dof_buscar_notas", { texto: scenario.busqueda_texto, limit: 3, offset: 8 });
    expect(codes(last)).toEqual(all.slice(8).map((note) => note.codNota));
    expect(last).toMatchObject({ count: 2, has_more: false });
    expect(last.next_offset).toBeUndefined();

    const oldest = await call("dof_buscar_notas", { texto: scenario.busqueda_texto, limit: 4, orden: "antiguas" });
    expect(codes(oldest)).toEqual(codes(first).map((_: number, index: number) => all.toReversed()[index]!.codNota));
    expect(requested.at(-1)).toEndWith("/fecha/asc");
  });

  test("too short a text is rejected before any request", async () => {
    expect(await errorOf("dof_buscar_notas", { texto: "ab" })).toContain("Input validation error");
    expect(fetch.calls).toEqual([]);
  });
});

describe("dof_indicadores", () => {
  test("without dates gives the latest value of each indicator", async () => {
    const output = await call("dof_indicadores");
    expect(output.modo).toBe("ultimo_valor");
    expect(output.valores.length).toBeGreaterThan(1);
    expect(new Set(output.valores.map((valor: any) => valor.indicador)).size).toBe(output.valores.length);
    expect(output.valores.every((valor: any) => valor.fecha <= scenario.hoy)).toBe(true);
  });

  test("one indicator can be asked by key or by code", async () => {
    const all = await call("dof_indicadores");
    const sample = all.valores[0];
    const byKey = await call("dof_indicadores", { indicador: sample.indicador });
    const byCode = await call("dof_indicadores", { indicador: sample.codigo });
    expect(byKey.valores).toEqual([sample]);
    expect(byCode.valores).toEqual([sample]);
  });

  test("a date gives that day's values", async () => {
    const raw = await json(`indicadores_hoy_menos_${lastDay}`);
    const output = await call("dof_indicadores", { fecha: scenario.ultima_edicion });
    expect(output.modo).toBe("fecha");
    expect(output.total_count).toBe(raw.ListaIndicadores.length);
    expect(output.valores.every((valor: any) => valor.fecha === scenario.ultima_edicion && typeof valor.valor === "number")).toBe(true);
  });

  test("a range gives the series in date order", async () => {
    const raw = await json(`indicadores_rango_${scenario.indicador_adelantado}`);
    const output = await call("dof_indicadores", {
      indicador: scenario.indicador_adelantado,
      fecha_desde: scenario.indicadores_desde,
      fecha_hasta: scenario.indicadores_hasta,
      limit: 500,
    });
    expect(output.modo).toBe("rango");
    expect(output.total_count).toBe(raw.ListaIndicadores.length);
    const dates = output.valores.map((valor: any) => valor.fecha);
    expect(dates).toEqual(dates.toSorted());
  });

  test("a date or range with nothing published is empty and says so", async () => {
    const far = await call("dof_indicadores", { fecha: scenario.fecha_futura });
    expect(far.total_count).toBe(0);
    expect(far.nota).toBeString();

    const unknown = entry("indicadores_rango_codigo_desconocido").url.split("/").at(-3);
    const none = await call("dof_indicadores", {
      indicador: Number(unknown),
      fecha_desde: scenario.indicadores_desde,
      fecha_hasta: scenario.indicadores_hasta,
    });
    expect(none.total_count).toBe(0);
    expect(none.nota).toContain(String(unknown));
  });

  test("errors say what to change", async () => {
    expect(await errorOf("dof_indicadores", { fecha: scenario.hoy, fecha_desde: scenario.hoy })).toContain("not both");
    expect(await errorOf("dof_indicadores", { fecha_desde: scenario.indicadores_desde })).toContain("indicador");
    expect(await errorOf("dof_indicadores", { fecha_hasta: scenario.hoy })).toContain("fecha_desde");
    expect(await errorOf("dof_indicadores", { indicador: scenario.indicador_adelantado, fecha_desde: addDays(scenario.hoy, -800), fecha_hasta: scenario.hoy })).toContain("maximum");
    expect(await errorOf("dof_indicadores", { indicador: "no_existe" })).toContain("Input validation error");
  });
});

describe("stdio", () => {
  test("the real entry point serves the tools over stdin and stdout", async () => {
    const stdio = new Client({ name: "test", version: "1.0.0" });
    await stdio.connect(
      new StdioClientTransport({ command: process.execPath, args: ["run", join(import.meta.dir, "..", "src", "index.ts")] }),
    );
    const { tools } = await stdio.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual(TOOLS);
    await stdio.close();
  });
});
