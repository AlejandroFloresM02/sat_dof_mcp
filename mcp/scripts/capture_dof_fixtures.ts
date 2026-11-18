/**
 * No date, note code or search term is written in this file. Each case is
 * found by rule from the live API when the script runs, and what was chosen
 * is recorded in test/fixtures/dof/manifest.json. Tests look fixtures up by
 * `caso` and read their dates from the manifest's `escenario`.
 *
 * The scenario: "today" is the last day of the most recent run of days with
 * no edition, so the latest edition is the day before that run. It covers
 * the walk back over days without an edition.
 *
 * Re-running replaces every fixture, so review the diff before committing.
 */
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import * as z from "zod/v4";
import {
  DOF_BASE_URL,
  INDICATOR_LOOKAHEAD_DAYS,
  INDICATOR_LOOKBACK_DAYS,
  TIMEOUT_MS,
} from "../src/dof/constants.ts";
import { addDays, eachDate, isoToDof, todayInMexicoCity, type IsoDate } from "../src/dof/dates.ts";
import { INDICATORS } from "../src/dof/indicators.ts";
import { IndicatorCatalogResponse, IndicatorRow, ListedNote, TitleSearchResponse } from "../src/dof/schemas.ts";

const OUT_DIR = join(import.meta.dir, "..", "test", "fixtures", "dof");

const SCAN_DAYS = 45;
const NOTE_CANDIDATES = 8;
const SMALL_NOTE_BYTES = 50_000;
const LEGACY_SCAN_DAYS = 15;
const LEGACY_YEARS_BACK = 10;

interface ManifestEntry {
  caso: string;
  archivo: string;
  url: string;
  nota: string;
  status: number;
  content_type: string | null;
  bytes: number;
  sha256: string;
  ms: number;
}

interface Fetched {
  url: string;
  status: number;
  contentType: string | null;
  bytes: Uint8Array;
  ms: number;
  json: unknown;
}

/** Only what this script reads: a body the DOF has changed elsewhere is still captured, and the schema tests report the change. */
const ListedNotes = z.array(ListedNote.pick({ codNota: true, titulo: true, tipoNota: true }));
const NotesBody = z.object({ NotasMatutinas: ListedNotes, NotasVespertinas: ListedNotes, NotasExtraordinarias: ListedNotes });
const RangeBody = z.object({ ListaIndicadores: z.array(IndicatorRow.pick({ fecha: true })) });
const CatalogBody = IndicatorCatalogResponse.pick({ lista: true });
const SearchBody = TitleSearchResponse.pick({ totalRegistros: true });
const JsonObject = z.record(z.string(), z.unknown());

function read<T>(schema: z.ZodType<T>, fetched: Fetched | undefined): T | undefined {
  const parsed = schema.safeParse(fetched?.json);
  return parsed.success ? parsed.data : undefined;
}

const entries: ManifestEntry[] = [];

async function get(path: string, timeoutMs: number = TIMEOUT_MS.default): Promise<Fetched> {
  const url = `${DOF_BASE_URL}${path}`;
  const started = Date.now();
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  const bytes = new Uint8Array(await response.arrayBuffer());
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    json = undefined;
  }
  return { url, status: response.status, contentType: response.headers.get("content-type"), bytes, ms: Date.now() - started, json };
}

async function save(caso: string, nota: string, fetched: Fetched): Promise<Fetched> {
  const archivo = `${caso}.${fetched.json === undefined ? "html" : "json"}`;
  await Bun.write(join(OUT_DIR, archivo), fetched.bytes);
  entries.push({
    caso,
    archivo,
    url: fetched.url,
    nota,
    status: fetched.status,
    content_type: fetched.contentType,
    bytes: fetched.bytes.byteLength,
    sha256: new Bun.CryptoHasher("sha256").update(fetched.bytes).digest("hex"),
    ms: fetched.ms,
  });
  console.error(`${fetched.status} ${String(fetched.bytes.byteLength).padStart(8)} B  ${caso}  ${fetched.url.slice(DOF_BASE_URL.length)}`);
  return fetched;
}

async function capture(caso: string, nota: string, path: string, timeoutMs?: number): Promise<Fetched> {
  return save(caso, nota, await get(path, timeoutMs));
}

function fail(message: string): never {
  console.error(`Cannot build the scenario: ${message}`);
  process.exit(1);
}

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });

const captureDay = todayInMexicoCity(new Date());
const scanned = new Map<IsoDate, Fetched>();
let scenarioToday: IsoDate | undefined;
let latestEdition: IsoDate | undefined;
for (let back = 1; back <= SCAN_DAYS && latestEdition === undefined; back++) {
  const date = addDays(captureDay, -back);
  const fetched = await get(`/diarios/porFecha/${isoToDof(date)}`);
  scanned.set(date, fetched);
  if (fetched.status === 404) scenarioToday ??= date;
  else if (fetched.status === 200 && scenarioToday !== undefined) latestEdition = date;
}
if (scenarioToday === undefined || latestEdition === undefined) {
  fail(`no run of days without an edition followed by an edition in the last ${SCAN_DAYS} days`);
}
const scenarioDays = eachDate(latestEdition, scenarioToday).reverse();

for (const [back, date] of scenarioDays.entries()) {
  const edition = scanned.get(date) ?? fail(`${date} was not scanned`);
  await save(`diarios_hoy_menos_${back}`, `Editions of ${date}, ${back} days before the scenario's today`, edition);
  await capture(`notas_hoy_menos_${back}`, `Notes of ${date}, ${back} days before the scenario's today`, `/notas/${isoToDof(date)}`);
}
const editionDof = isoToDof(latestEdition);
const notes = read(NotesBody, await get(`/notas/${editionDof}`)) ?? fail(`${latestEdition} did not answer with its lists of notes`);
const listed = [...notes.NotasMatutinas, ...notes.NotasVespertinas, ...notes.NotasExtraordinarias];
if (listed.length === 0) fail(`${latestEdition} has an edition but no notes`);

const editionKeys: Record<string, string> = { Matutina: "MAT", Vespertina: "VES", Extraordinaria: "EXT" };
const editionsBody = read(JsonObject, scanned.get(latestEdition)) ?? {};
const presentCode = Object.entries(editionKeys).find(([key]) => Array.isArray(editionsBody[key]))?.[1];
if (presentCode === undefined) fail(`${latestEdition} answered 200 without any edition`);
await capture("diario_edicion", "One edition by date and type", `/diarios/obtieneDiario/${editionDof}/${presentCode}`);
await capture(
  "diario_edicion_inexistente",
  "Edition that does not exist: 404 NOT_FOUND",
  `/diarios/obtieneDiario/${isoToDof(scenarioToday)}/${presentCode}`,
);

const [day, month, year] = editionDof.split("-") as [string, string, string];
const futureDate = isoToDof(addDays(captureDay, 365 * 3));
await capture("notas_fecha_futura", "Future date: same empty 200 as a day without an edition", `/notas/${futureDate}`);
await capture("notas_fecha_formato_iso", "ISO date is rejected", `/notas/${latestEdition}`);
await capture("notas_fecha_sin_ceros", "Month day without zero padding is rejected", `/notas/1-${month}-${year}`);
await capture("notas_fecha_imposible", "Impossible date", `/notas/32-13-${year}`);
await capture("diarios_fecha_formato_iso", "ISO date: answered like a day without an edition", `/diarios/porFecha/${latestEdition}`);
await capture("diarios_fecha_futura", "Future date: answered like a day without an edition", `/diarios/porFecha/${futureDate}`);

let foundSections = false;
for (let back = 0; back < LEGACY_SCAN_DAYS && !foundSections; back++) {
  const date = addDays(`${Number(year) - LEGACY_YEARS_BACK}-${month}-${day}`, -back);
  const fetched = await get(`/diarios/porFecha/${isoToDof(date)}`);
  const body = read(JsonObject, fetched) ?? {};
  const sections = Object.keys(editionKeys).map((key) => body[key]).filter(Array.isArray);
  if (sections.some((list) => list.length > 1)) {
    await save("diarios_fecha_secciones", `${date}: one element per section of the same edition`, fetched);
    foundSections = true;
  }
}
if (!foundSections) fail(`no edition split into sections in the ${LEGACY_SCAN_DAYS} days before ${LEGACY_YEARS_BACK} years ago`);

const heading = listed.find((note) => note.titulo === undefined);
if (heading === undefined) fail(`${latestEdition} has no note without a title`);
await capture("nota_detalle_encabezado", "Group heading: no titulo, no cadenaContenido", `/notas/nota/${heading.codNota}`);
// Judicial notices (tipoNota AVISO) are left out: their bodies name private parties.
// The body that is kept is still a third party's text: read it before committing.
const candidates = listed.filter((note) => note.titulo !== undefined && note.tipoNota !== "AVISO").slice(0, NOTE_CANDIDATES);
let smallest: Fetched | undefined;
for (const note of candidates) {
  const fetched = await get(`/notas/nota/${note.codNota}`, TIMEOUT_MS.noteDetail);
  if (fetched.status !== 200) continue;
  if (smallest === undefined || fetched.bytes.byteLength < smallest.bytes.byteLength) smallest = fetched;
  if (smallest.bytes.byteLength < SMALL_NOTE_BYTES) break;
}
if (smallest === undefined) fail("no note detail could be downloaded");
await save("nota_detalle", "Smallest complete note found among the first of the edition", smallest);

const highestCode = Math.max(...listed.map((note) => note.codNota));
await capture("nota_detalle_inexistente", "Unknown code: 200 with Nota as an empty array", `/notas/nota/${highestCode * 10}`);
await capture("nota_detalle_no_numerica", "Non-numeric code", "/notas/nota/abc");

const catalog = await capture("catalogo_indicadores", "Indicator names (undocumented route)", "/catalogos/cat_tipos_indicadores");
for (const [back, date] of scenarioDays.entries()) {
  await capture(`indicadores_hoy_menos_${back}`, `Indicators of ${date}`, `/indicadores/${isoToDof(date)}`);
}
const rangeFrom = isoToDof(addDays(scenarioToday, -INDICATOR_LOOKBACK_DAYS));
const rangeTo = isoToDof(addDays(scenarioToday, INDICATOR_LOOKAHEAD_DAYS));
const catalogCodes: number[] = (read(CatalogBody, catalog)?.lista ?? []).map((row) => Number(row.id));
const codes = [...new Set([...INDICATORS.map((indicator) => indicator.code), ...catalogCodes])].sort((a, b) => a - b);
/** The indicator whose values reach furthest past the scenario's today: one the DOF publishes ahead. */
let aheadCode: number | undefined;
let furthest: string = scenarioToday;
for (const code of codes) {
  const range = await capture(
    `indicadores_rango_${code}`,
    `Indicator ${code} over the freshness window around the scenario's today`,
    `/indicadores/${code}/${rangeFrom}/${rangeTo}`,
    TIMEOUT_MS.indicatorRange,
  );
  const dates: string[] = (read(RangeBody, range)?.ListaIndicadores ?? []).map((row) => row.fecha.split("-").reverse().join("-"));
  const last = dates.toSorted().at(-1);
  if (last !== undefined && last > furthest) [aheadCode, furthest] = [code, last];
}
if (aheadCode === undefined) fail("no indicator has a value dated after the scenario's today");
await capture(
  "indicadores_rango_codigo_desconocido",
  "Indicator code that is not in the catalog",
  `/indicadores/${Math.max(...codes) * 10}/${rangeFrom}/${rangeTo}`,
);
await capture("indicadores_rango_invertido", "Range whose end is before its start", `/indicadores/${codes[0]}/${rangeTo}/${rangeFrom}`);
await capture("indicadores_fecha_lejana", "Date past every published value", `/indicadores/${futureDate}`);

const SEARCH_SIZE = 3;
const firstTitle: string = listed.find((note) => note.titulo !== undefined && note.tipoNota !== "AVISO")?.titulo ?? "";
const searchText = firstTitle.split(/\s+/).slice(0, 3).join(" ").replace(/[^\p{L}\p{N} ]/gu, "");
if (searchText.length < 3) fail("no note title to build a search from");
const search = await capture(
  "buscar_titulo",
  `First page of ${SEARCH_SIZE} for the first words of a title of the edition`,
  `/buscarNotas/titulo/${encodeURIComponent(searchText)}/1/${SEARCH_SIZE}/fecha/desc`,
  TIMEOUT_MS.noteDetail,
);
const pagePastEnd = Math.ceil((read(SearchBody, search)?.totalRegistros ?? 0) / SEARCH_SIZE) + 10;
await capture(
  "buscar_titulo_pagina_fuera",
  "Page past the end",
  `/buscarNotas/titulo/${encodeURIComponent(searchText)}/${pagePastEnd}/${SEARCH_SIZE}/fecha/desc`,
  TIMEOUT_MS.noteDetail,
);
const noMatch = crypto.randomUUID().replaceAll("-", "");
await capture(
  "buscar_titulo_sin_resultados",
  "Random text with no matches",
  `/buscarNotas/titulo/${noMatch}/1/${SEARCH_SIZE}/fecha/desc`,
  TIMEOUT_MS.noteDetail,
);

await capture("ruta_inexistente", "Router 404: the service does not exist", "/diarios/");

const manifest = {
  fecha_captura: new Date().toISOString(),
  origen: DOF_BASE_URL,
  nota: "Bodies are the bytes as downloaded. Cases are chosen by rule in scripts/capture_dof_fixtures.ts.",
  escenario: {
    hoy: scenarioToday,
    ultima_edicion: latestEdition,
    dias: scenarioDays,
    fecha_futura: addDays(captureDay, 365 * 3),
    indicadores_desde: addDays(scenarioToday, -INDICATOR_LOOKBACK_DAYS),
    indicadores_hasta: addDays(scenarioToday, INDICATOR_LOOKAHEAD_DAYS),
    indicador_adelantado: aheadCode,
    busqueda_texto: searchText,
    busqueda_limite: SEARCH_SIZE,
  },
  archivos: entries,
};
await Bun.write(join(OUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.error(`Wrote ${entries.length} fixtures to ${OUT_DIR}`);
