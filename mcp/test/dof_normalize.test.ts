import { describe, expect, test } from "bun:test";
import { addDays, daysBetween, dofToIso, eachDate, isIsoDate, isoToDof, todayInMexicoCity } from "../src/dof/dates.ts";
import {
  cleanText,
  foldText,
  normalizeEditions,
  normalizeIndicators,
  normalizeNotesByDate,
  parseIndicatorValue,
} from "../src/dof/normalize.ts";
import { EditionsByDateResponse, IndicatorsResponse, NotesByDateResponse } from "../src/dof/schemas.ts";
import { json, scenario } from "./helpers/fixtures.ts";
import { defined } from "./helpers/narrow.ts";

const lastDay = scenario.dias.length - 1;

describe("dates", () => {
  test("round trip between ISO and the DOF form", () => {
    for (const date of scenario.dias) expect(dofToIso(isoToDof(date))).toBe(date);
  });

  test("rejects days that do not exist", () => {
    const year = scenario.hoy.slice(0, 4);
    expect(isIsoDate(`${year}-02-31`)).toBe(false);
    expect(isIsoDate(`${year}-13-01`)).toBe(false);
    expect(isIsoDate(isoToDof(scenario.hoy))).toBe(false);
    expect(dofToIso(`31-02-${year}`)).toBeUndefined();
    expect(() => isoToDof(`${year}-02-31`)).toThrow(RangeError);
  });

  test("day arithmetic crosses month and year ends", () => {
    const start = `${scenario.hoy.slice(0, 4)}-12-31`;
    expect(daysBetween(start, addDays(start, 1))).toBe(1);
    expect(addDays(start, 1).slice(5)).toBe("01-01");
    expect(eachDate(start, addDays(start, 2))).toHaveLength(3);
    expect(eachDate(start, addDays(start, -1))).toEqual([]);
  });

  test("today follows Mexico City, not UTC", () => {
    // 03:00 UTC is still the previous evening in Mexico City.
    expect(todayInMexicoCity(new Date(`${scenario.hoy}T03:00:00Z`))).toBe(addDays(scenario.hoy, -1));
    expect(todayInMexicoCity(new Date(`${scenario.hoy}T18:00:00Z`))).toBe(scenario.hoy);
  });
});

describe("empty values", () => {
  test.each([[null], [undefined], [""], ["  "], ["null"], ["NULL"]])("%p becomes undefined", (value) => {
    expect(cleanText(value)).toBeUndefined();
  });

  test("real text is trimmed and kept", () => {
    expect(cleanText(" PODER EJECUTIVO ")).toBe("PODER EJECUTIVO");
  });

  test("folding ignores accents and case", () => {
    expect(foldText("Resolución MISCELÁNEA")).toBe("resolucion miscelanea");
  });
});

describe("indicator values", () => {
  test.each([
    ["18.5525", 18.5525],
    ["6.26%", 6.26],
    ["20.3093 ", 20.3093],
    [" 4.181946", 4.181946],
    ["7. 8425%", 7.8425],
    ["4.8850 %", 4.885],
    ["-0.5", -0.5],
  ])("%p is %p", (raw, expected) => {
    expect(parseIndicatorValue(raw)).toBe(expected);
  });

  test.each([[""], ["N/E"], ["1,234.5"], ["1.2.3"]])("%p is not a number", (raw) => {
    expect(parseIndicatorValue(raw)).toBeNull();
  });

  test("rows come out in date order whatever order the DOF sends", async () => {
    const raw = IndicatorsResponse.parse(await json(`indicadores_rango_${scenario.indicador_adelantado}`));
    const values = normalizeIndicators([...raw.ListaIndicadores].reverse());
    expect(values.map((value) => value.fecha)).toEqual(values.map((value) => value.fecha).toSorted());
    expect(values).toHaveLength(raw.ListaIndicadores.length);
    expect(values.every((value) => typeof value.valor === "number" && value.codigo === scenario.indicador_adelantado)).toBe(true);
    expect(values.some((value) => value.duplicado)).toBe(false);
  });

  test("two values for the same indicator and date are both kept and flagged", async () => {
    const raw = IndicatorsResponse.parse(await json(`indicadores_rango_${scenario.indicador_adelantado}`));
    const first = defined(raw.ListaIndicadores[0], "a row in the range");
    const values = normalizeIndicators([...raw.ListaIndicadores, { ...first, valor: `${first.valor}9` }]);
    expect(values).toHaveLength(raw.ListaIndicadores.length + 1);
    expect(values.filter((value) => value.duplicado)).toHaveLength(2);
  });

  test("a code outside the reference table still comes through", async () => {
    const raw = IndicatorsResponse.parse(await json(`indicadores_rango_${scenario.indicador_adelantado}`));
    const [value] = normalizeIndicators([{ ...defined(raw.ListaIndicadores[0], "a row in the range"), codTipoIndicador: 1 }]);
    expect(value?.indicador).toBeUndefined();
    expect(value?.nombre).toContain("1");
  });
});

describe("notes of a day", () => {
  test("titled notes are kept, headings are counted, and nothing is lost", async () => {
    const raw = NotesByDateResponse.parse(await json(`notas_hoy_menos_${lastDay}`));
    const all = [...raw.NotasMatutinas, ...raw.NotasVespertinas, ...raw.NotasExtraordinarias];
    const titled = all.filter((note) => typeof note.titulo === "string");
    const day = normalizeNotesByDate(raw);

    expect(all.length).toBeGreaterThan(0);
    expect(day.publicaciones).toHaveLength(titled.length);
    expect(day.encabezados_omitidos).toBe(all.length - titled.length);
    expect(new Set(day.publicaciones.map((nota) => nota.cod_nota)).size).toBe(titled.length);
    expect(day.publicaciones.every((nota) => nota.fecha === scenario.ultima_edicion)).toBe(true);
    expect(day.publicaciones.filter((nota) => nota.tipo === "aviso")).toHaveLength(all.filter((note) => note.tipoNota === "AVISO" && note.titulo).length);
    expect(JSON.stringify(day)).not.toContain('"null"');
  });

  test("the edition comes from the array the note arrived in", async () => {
    const raw = NotesByDateResponse.parse(await json(`notas_hoy_menos_${lastDay}`));
    const day = normalizeNotesByDate(raw);
    const expected = { MAT: raw.NotasMatutinas, VES: raw.NotasVespertinas, EXT: raw.NotasExtraordinarias };
    for (const [edicion, notes] of Object.entries(expected)) {
      expect(day.publicaciones.filter((nota) => nota.edicion === edicion)).toHaveLength(notes.filter((note) => note.titulo).length);
    }
  });

  test("a day without an edition gives nothing", async () => {
    const day = normalizeNotesByDate(NotesByDateResponse.parse(await json("notas_hoy_menos_0")));
    expect(day).toEqual({ publicaciones: [], encabezados_omitidos: 0 });
  });
});

describe("editions", () => {
  test("one record per edition present", async () => {
    const raw = EditionsByDateResponse.parse(await json(`diarios_hoy_menos_${lastDay}`));
    const present = [raw.Matutina, raw.Vespertina, raw.Extraordinaria].filter(Array.isArray);
    const editions = normalizeEditions(raw);
    expect(editions).toHaveLength(present.length);
    expect(editions.every((edition) => Number.isInteger(edition.paginas))).toBe(true);
  });

  test("sections of an old edition are merged and their pages added", async () => {
    const raw = EditionsByDateResponse.parse(await json("diarios_fecha_secciones"));
    const sections = [raw.Matutina, raw.Vespertina, raw.Extraordinaria].filter(Array.isArray).flat();
    const editions = normalizeEditions(raw);
    expect(sections.length).toBeGreaterThan(editions.length);
    expect(editions.flatMap((edition) => edition.secciones)).toHaveLength(sections.length);
    expect(editions.reduce((sum, edition) => sum + (edition.paginas ?? 0), 0)).toBe(
      sections.reduce((sum, section) => sum + Number(section.paginaMax), 0),
    );
  });
});
