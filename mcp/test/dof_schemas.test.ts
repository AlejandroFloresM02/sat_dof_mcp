import { describe, expect, test } from "bun:test";
import type * as z from "zod/v4";
import {
  EditionByTypeResponse,
  EditionsByDateResponse,
  ErrorResponse,
  IndicatorCatalogResponse,
  IndicatorsResponse,
  NoteDetailResponse,
  NotesByDateResponse,
  TitleSearchResponse,
} from "../src/dof/schemas.ts";
import { INDICATORS } from "../src/dof/indicators.ts";
import { entries, json, scenario } from "./helpers/fixtures.ts";

const SCHEMAS: [prefix: string, schema: z.ZodType][] = [
  ["notas_", NotesByDateResponse],
  ["nota_detalle", NoteDetailResponse],
  ["diarios_", EditionsByDateResponse],
  ["diario_edicion", EditionByTypeResponse],
  ["indicadores_", IndicatorsResponse],
  ["catalogo_indicadores", IndicatorCatalogResponse],
  ["buscar_titulo", TitleSearchResponse],
];

function schemaFor(caso: string): z.ZodType {
  const match = SCHEMAS.find(([prefix]) => caso.startsWith(prefix));
  if (match === undefined) throw new Error(`No schema mapped for ${caso}`);
  return match[1];
}

describe("raw schemas against the captured responses", () => {
  const successes = entries.filter((item) => item.status === 200);
  const failures = entries.filter((item) => item.status !== 200);

  test("the capture has both successes and failures", () => {
    expect(successes.length).toBeGreaterThan(0);
    expect(failures.length).toBeGreaterThan(0);
  });

  test.each(successes.map((item) => item.caso))("%s parses", async (caso) => {
    const result = schemaFor(caso).safeParse(await json(caso));
    expect(result.error?.issues ?? []).toEqual([]);
  });

  test.each(failures.map((item) => item.caso))("%s is a failure the client can recognise", async (caso) => {
    const parsed = await json(caso);
    const envelope = ErrorResponse.safeParse(parsed);
    if (envelope.success) expect(envelope.data.messageCode).not.toBe(200);
    else expect(parsed).toEqual({});
  });
});

describe("shapes the schemas exist for", () => {
  test("an unknown note code answers with Nota as an empty array", async () => {
    const parsed = NoteDetailResponse.parse(await json("nota_detalle_inexistente"));
    expect(parsed.Nota).toEqual([]);
  });

  test("a heading has neither title nor body", async () => {
    const parsed = NoteDetailResponse.parse(await json("nota_detalle_encabezado"));
    expect(Array.isArray(parsed.Nota)).toBe(false);
    expect(parsed.Nota).not.toHaveProperty("titulo");
    expect(parsed.Nota).not.toHaveProperty("cadenaContenido");
  });

  test("a complete note carries its HTML body", async () => {
    const parsed = NoteDetailResponse.parse(await json("nota_detalle"));
    if (Array.isArray(parsed.Nota)) throw new Error("expected a note");
    expect(parsed.Nota.cadenaContenido).toMatch(/<html/i);
  });

  test("edition keys are an array or null, never missing data as an empty array", async () => {
    const parsed = EditionsByDateResponse.parse(await json(`diarios_hoy_menos_${scenario.dias.length - 1}`));
    const values = [parsed.Matutina, parsed.Vespertina, parsed.Extraordinaria];
    expect(values.some((value) => Array.isArray(value) && value.length > 0)).toBe(true);
    for (const value of values) expect(Array.isArray(value) ? value.length > 0 : value === null).toBe(true);
  });

  test("the reference table matches the DOF catalog", async () => {
    const catalog = IndicatorCatalogResponse.parse(await json("catalogo_indicadores"));
    const fromCatalog = catalog.lista.map((row) => [Number(row.id), row.value]).sort();
    const fromTable = INDICATORS.map((info) => [info.code, info.catalogName]).sort();
    expect(fromTable).toEqual(fromCatalog);
  });
});
