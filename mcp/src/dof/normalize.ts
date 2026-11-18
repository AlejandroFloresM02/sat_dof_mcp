import { DOF_PUBLIC_NOTE_URL } from "./constants.ts";
import type { EditionCode } from "./client.ts";
import { dofToIso, type IsoDate } from "./dates.ts";
import { indicatorByCode } from "./indicators.ts";
import type { EditionsByDateResponse, FoundNote, IndicatorRow, ListedNote, NotesByDateResponse } from "./schemas.ts";

/** The DOF sends an empty value as a missing key, JSON null, "" or the string "null". */
export function cleanText(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" || trimmed.toLowerCase() === "null" ? undefined : trimmed;
}

function isoOrThrow(dofDate: string): IsoDate {
  const iso = dofToIso(dofDate);
  if (iso === undefined) throw new RangeError(`The DOF sent a date that does not exist: ${dofDate}`);
  return iso;
}

/** Matches text the way the DOF search does. */
export function foldText(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function publicNoteUrl(codNota: number, date: IsoDate): string {
  const [year, month, day] = date.split("-");
  return `${DOF_PUBLIC_NOTE_URL}?codigo=${codNota}&fecha=${day}/${month}/${year}`;
}

export interface Publicacion {
  cod_nota: number;
  titulo: string;
  fecha: IsoDate;
  edicion: EditionCode;
  cod_diario: number;
  pagina?: number;
  organismo?: string;
  dependencia?: string;
  tipo: "nota" | "aviso";
  url: string;
}

export interface PublicacionesDelDia {
  publicaciones: Publicacion[];
  encabezados_omitidos: number;
}

const EDITION_ARRAYS: readonly (readonly [keyof Pick<NotesByDateResponse, "NotasMatutinas" | "NotasVespertinas" | "NotasExtraordinarias">, EditionCode])[] = [
  ["NotasMatutinas", "MAT"],
  ["NotasVespertinas", "VES"],
  ["NotasExtraordinarias", "EXT"],
];

function toPublicacion(note: ListedNote, edicion: EditionCode, titulo: string): Publicacion {
  const fecha = isoOrThrow(note.fecha);
  return {
    cod_nota: note.codNota,
    titulo,
    fecha,
    edicion,
    cod_diario: note.codDiario,
    ...(typeof note.pagina === "number" ? { pagina: note.pagina } : {}),
    ...optional("organismo", cleanText(note.nombreCodOrgaUno)),
    ...optional("dependencia", cleanText(note.codOrgaDos)),
    tipo: cleanText(note.tipoNota)?.toUpperCase() === "AVISO" ? "aviso" : "nota",
    url: publicNoteUrl(note.codNota, fecha),
  };
}

function optional<K extends string, V>(key: K, value: V | undefined): { [P in K]?: V } {
  return (value === undefined ? {} : { [key]: value }) as { [P in K]?: V };
}

export function normalizeNotesByDate(response: NotesByDateResponse): PublicacionesDelDia {
  const publicaciones: Publicacion[] = [];
  let encabezados_omitidos = 0;
  for (const [key, edicion] of EDITION_ARRAYS) {
    const sorted = [...response[key]].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    for (const note of sorted) {
      const titulo = cleanText(note.titulo);
      if (titulo === undefined) encabezados_omitidos++;
      else publicaciones.push(toPublicacion(note, edicion, titulo));
    }
  }
  return { publicaciones, encabezados_omitidos };
}

export interface NotaEncontrada {
  cod_nota: number;
  titulo: string;
  fecha: IsoDate;
  cod_diario: number;
  organismo?: string;
  dependencia?: string;
  url: string;
}

export function normalizeFoundNote(note: FoundNote): NotaEncontrada {
  const fecha = isoOrThrow(note.fecha);
  return {
    cod_nota: note.codNota,
    titulo: cleanText(note.titulo) ?? "(sin título)",
    fecha,
    cod_diario: note.codDiario,
    ...optional("organismo", cleanText(note.codOrgaUno)),
    ...optional("dependencia", cleanText(note.codOrgaDos)),
    url: publicNoteUrl(note.codNota, fecha),
  };
}

export interface Edicion {
  edicion: EditionCode;
  cod_diario: number;
  paginas?: number;
  secciones: string[];
}

const EDITION_KEYS: readonly (readonly [keyof Pick<EditionsByDateResponse, "Matutina" | "Vespertina" | "Extraordinaria">, EditionCode])[] = [
  ["Matutina", "MAT"],
  ["Vespertina", "VES"],
  ["Extraordinaria", "EXT"],
];

/** Old editions arrive as one element per section of the same `codDiario`. */
export function normalizeEditions(response: EditionsByDateResponse): Edicion[] {
  const editions: Edicion[] = [];
  for (const [key, edicion] of EDITION_KEYS) {
    const byDiario = new Map<number, Edicion & { pageCounts: (number | undefined)[] }>();
    for (const section of response[key] ?? []) {
      let entry = byDiario.get(section.codDiario);
      if (entry === undefined) {
        entry = { edicion, cod_diario: section.codDiario, secciones: [], pageCounts: [] };
        byDiario.set(section.codDiario, entry);
      }
      const name = cleanText(section.codSeccion);
      if (name !== undefined) entry.secciones.push(name);
      const pages = Number(cleanText(section.paginaMax));
      entry.pageCounts.push(Number.isInteger(pages) && pages > 0 ? pages : undefined);
    }
    for (const { pageCounts, ...entry } of byDiario.values()) {
      const known = pageCounts.every((count) => count !== undefined);
      editions.push(known ? { ...entry, paginas: pageCounts.reduce<number>((sum, count) => sum + (count ?? 0), 0) } : entry);
    }
  }
  return editions;
}

export interface ValorIndicador {
  codigo: number;
  indicador?: string;
  nombre: string;
  unidad?: string;
  fecha: IsoDate;
  valor: number | null;
  valor_original: string;
  duplicado?: true;
}

/** The DOF writes values as text with stray spaces ("7. 8425%") and an inconsistent "%". */
export function parseIndicatorValue(raw: string): number | null {
  const compact = raw.replace(/\s+/g, "").replace(/%$/, "");
  return /^-?\d+(\.\d+)?$/.test(compact) ? Number(compact) : null;
}

export function normalizeIndicators(rows: readonly IndicatorRow[]): ValorIndicador[] {
  const seen = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.codTipoIndicador}|${row.fecha}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return rows
    .map((row): ValorIndicador => {
      const info = indicatorByCode(row.codTipoIndicador);
      return {
        codigo: row.codTipoIndicador,
        ...optional("indicador", info?.key),
        nombre: info?.name ?? `Indicador ${row.codTipoIndicador}`,
        ...optional("unidad", info?.unit),
        fecha: isoOrThrow(row.fecha),
        valor: parseIndicatorValue(row.valor),
        valor_original: row.valor,
        ...((seen.get(`${row.codTipoIndicador}|${row.fecha}`) ?? 0) > 1 ? { duplicado: true as const } : {}),
      };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.codigo - b.codigo);
}
