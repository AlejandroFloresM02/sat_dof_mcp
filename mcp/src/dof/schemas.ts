/**
 * - No note schema is shared between routes, because the same field changes
 *   meaning: `codOrgaUno` is a code in the notes of a date and a name in the
 *   note detail and the search.
 * - Only the fields the server relies on are required, so a field the DOF
 *   drops or renames does not break every response.
 */
import * as z from "zod/v4";

const DofDate = z.string().regex(/^\d{2}-\d{2}-\d{4}$/);

const Text = z.string().nullish();

/** "S" or "N". */
const Flag = z.string().nullish();

export const ErrorResponse = z.object({
  messageCode: z.number(),
  response: z.string(),
});
export type ErrorResponse = z.infer<typeof ErrorResponse>;

const Envelope = {
  messageCode: z.number(),
  response: z.string(),
};

export const ListedNote = z.object({
  codNota: z.number().int(),
  /** Missing on group headings, which have no body either. */
  titulo: Text,
  codSeccion: Text,
  fecha: DofDate,
  codDiario: z.number().int(),
  existeHtml: Flag,
  existeDoc: Flag,
  existeImagen: Flag,
  existePdf: Flag,
  tipoNota: Text,
  estado: z.number().nullish(),
  pagina: z.number().nullish(),
  paginaHasta: z.number().nullish(),
  nombreCodOrgaUno: Text,
  codOrgaUno: Text,
  codOrgaDos: Text,
  orden: z.number().nullish(),
});
export type ListedNote = z.infer<typeof ListedNote>;

/**
 * A day without an edition and a future date both answer 200 with the three
 * arrays empty. `NotasExtraordinarias` was never seen with elements; its
 * shape is assumed.
 */
export const NotesByDateResponse = z.object({
  ...Envelope,
  NotasMatutinas: z.array(ListedNote),
  NotasVespertinas: z.array(ListedNote),
  NotasExtraordinarias: z.array(ListedNote),
  imagenesDiario: z.array(z.record(z.string(), z.unknown())).nullish(),
  audioSumario: z.array(z.record(z.string(), z.unknown())).nullish(),
});
export type NotesByDateResponse = z.infer<typeof NotesByDateResponse>;

export const NoteDetail = z.object({
  codNota: z.number().int(),
  titulo: Text,
  codSeccion: Text,
  fecha: DofDate,
  codDiario: z.number().int(),
  /** The note body: a full HTML document. */
  cadenaContenido: Text,
  existeDoc: Flag,
  existeImagen: Flag,
  existePdf: Flag,
  tipoNota: Text,
  estado: z.number().nullish(),
  pagina: z.number().nullish(),
  paginaHasta: z.number().nullish(),
  codOrgaUno: Text,
  codOrgaDos: Text,
  codOrgaTres: Text,
  codOrgaCuatro: Text,
  nombOrganismo: Text,
  orden: z.number().nullish(),
  codEdicion: Text,
  /** Not reliable: 0 for notes of any size. */
  tamanioContenido: z.number().nullish(),
  ordenSeccion: z.number().nullish(),
});
export type NoteDetail = z.infer<typeof NoteDetail>;

/** `Nota` is an empty array when the code is unknown. */
export const NoteDetailResponse = z.object({
  ...Envelope,
  Nota: z.union([NoteDetail, z.array(z.unknown()).length(0)]),
  tamanioExcesivo: z.boolean().nullish(),
});
export type NoteDetailResponse = z.infer<typeof NoteDetailResponse>;

export const EditionSection = z.object({
  codDiario: z.number().int(),
  codSeccion: Text,
  paginaIni: Text,
  paginaMax: Text,
  orden: z.number().nullish(),
  /** The rest were null in every response seen. */
  codImagen: z.unknown().optional(),
  pagina: z.unknown().optional(),
  tipoArchivo: z.unknown().optional(),
  nombreArchivo: z.unknown().optional(),
  tipoPagina: z.unknown().optional(),
});
export type EditionSection = z.infer<typeof EditionSection>;

/** `Extraordinaria` was never seen with elements; its shape is assumed. */
export const EditionsByDateResponse = z.object({
  ...Envelope,
  Matutina: z.array(EditionSection).nullish(),
  Vespertina: z.array(EditionSection).nullish(),
  Extraordinaria: z.array(EditionSection).nullish(),
});
export type EditionsByDateResponse = z.infer<typeof EditionsByDateResponse>;

export const EditionByTypeResponse = z.object({
  ...Envelope,
  diario: z.object({
    codDiario: z.number().int(),
    codEdicion: z.string(),
    fecha: DofDate,
    estado: z.number().nullish(),
  }),
});
export type EditionByTypeResponse = z.infer<typeof EditionByTypeResponse>;

export const IndicatorRow = z.object({
  /** A row id. The indicator is `codTipoIndicador`. */
  codIndicador: z.number().int(),
  codTipoIndicador: z.number().int(),
  fecha: DofDate,
  valor: z.string(),
});
export type IndicatorRow = z.infer<typeof IndicatorRow>;

/** Rows are not ordered by date. */
export const IndicatorsResponse = z.object({
  ...Envelope,
  ListaIndicadores: z.array(IndicatorRow),
  TotalIndicadores: z.number().nullish(),
});
export type IndicatorsResponse = z.infer<typeof IndicatorsResponse>;

export const IndicatorCatalogResponse = z.object({
  ...Envelope,
  lista: z.array(z.object({ id: z.string(), value: z.string() })),
});
export type IndicatorCatalogResponse = z.infer<typeof IndicatorCatalogResponse>;

export const FoundNote = z.object({
  codNota: z.number().int(),
  titulo: Text,
  fecha: DofDate,
  codDiario: z.number().int(),
  estado: z.number().nullish(),
  paginaHasta: z.number().nullish(),
  codOrgaUno: Text,
  codOrgaDos: Text,
});
export type FoundNote = z.infer<typeof FoundNote>;

export const TitleSearchResponse = z.object({
  ...Envelope,
  totalRegistros: z.number().int(),
  Notas: z.array(FoundNote),
});
export type TitleSearchResponse = z.infer<typeof TitleSearchResponse>;
