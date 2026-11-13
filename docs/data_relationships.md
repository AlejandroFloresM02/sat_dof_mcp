# Data relationships and how to read them

13 November 2026 · companion to [design_connector.md](design_connector.md) · legal meaning of the terms: [glossary.md](glossary.md)

This document records what each source row represents, how the sources join, and the exact steps to read each relationship. The data model and the tool outputs in the design follow from it.

**Where the numbers come from.** Three analyses ran on 13 November: the 22 SAT lists (snapshot of 25 October), about 55 live requests to the DOF API, and the SAT Excel files downloaded that day. Figures are measured unless marked *inference*. Three findings were re-checked independently against the live API and are marked *re-checked*.

## What one row is

| Source | One row is | Natural key |
| --- | --- | --- |
| 69-B (complete list) | One presumption procedure, carrying its later stages | RFC + presumption notice number. RFC alone repeats: 84 RFCs have 2 or 3 rows |
| 69-B Bis | Same, with 2 stages | RFC |
| Firmes, No localizados, Exigibles | A taxpayer's current state on that list | RFC |
| Condonados 146-B, por decreto, recargos art. 21, Retorno de inversiones | A taxpayer | RFC |
| CSD sin efectos | A certificate-cancellation event | RFC + cancellation date |
| Entes públicos omisos | An unfiled obligation period | RFC + `EJERCICIO` + `PERIODO` |
| Historic 2007–2015 (two files) | A credit per year | RFC + year + amount |
| Cancelados | A cancellation event | None. 2,525 RFCs have several rows; 2 exact duplicate rows |
| Reducción de multas (art. 74) | A fine-reduction authorisation (*inference*) | None. 11,089 extra exact-duplicate rows, up to 32 copies of one row |
| Sentencias | Unclear | None. 17 exact-duplicate rows |
| DOF note | A published document | `codNota`; belongs to an edition `codDiario` |
| DOF indicator | A value on a date | `codTipoIndicador` + `fecha` |
| Statistics series | One observation | File + column + year + period |
| Charities directory | An authorisation per activity | RFC + activity. 10,507 RFCs in 16,157 rows |
| CFDI catalog | A code | Per sheet; several keys are composite |

The 91 rows of 69-B whose RFC is `XXXXXXXXXXXX` have no key at all: the name holds court-order text.

## Relationships

### 1. DOF notice ↔ 69-B rows

**Join key:** notice number + RFC. A row carries a SAT number and a DOF number per stage; match on either.

How to read it:

1. `GET /notas/{DD-MM-YYYY}` and keep notes whose `titulo` starts with "Oficio" and mentions 69-B.
2. Take the token after "Oficio " up to " mediante". Replace every run of spaces or dashes with one dash. This is the notice number.
3. `GET /notas/nota/{codNota}`. In `cadenaContenido`, read each `<tr>`: the RFC is the second cell (the first is a row number) and must match `^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$`. A note prints the same taxpayers in 2 to 5 tables, so collect RFCs as a set.
4. In `sat_69b_listado_completo.csv`, normalise the notice cells the same way and match the number in the columns of the matching stage. Check the DOF-notice column first, then the SAT-notice column.

| Note | Stage | RFCs in note / rows in CSV | Note `fecha` equals |
| --- | --- | --- | --- |
| 5801999 | Presumption | 171 / 171 (170 identical RFCs, 1 differing; *re-checked*) | Not yet in the October file |
| 5800845 | Definitive | 106 / 106 | "Publicación DOF definitivos" for all 106 |
| 5792568 | Favourable ruling | 3 / 3 | "Publicación DOF sentencia favorable" |
| 5781640 | Desvirtuados | 2 / 2 | "Publicación DOF desvirtuados" |

**Worked example.** Note 5800845 (09-10-2026) is the definitive notice whose number ends in `2026-24526`; the CSV has 106 rows with that number in the definitive columns, all with DOF date 09/10/2026.

Three things to know:

- **The SAT page publishes first; only the file's DOF columns lag.** A notice appears on the SAT page weeks before the DOF prints it: a median of 21 to 27 days over all years, and 53 to 63 days in 2026 according to the October report. Once the DOF does print it, the DOF date reaches the SAT file only at the next re-upload. In the October file, 171 presumption rows, 92 definitive rows and 10 favourable-ruling rows have a SAT page date and an empty DOF date; the 171 are note 5801999, published on 23 October. The DOF ingest can supply those dates sooner.
- **The SAT and DOF notice numbers of one row can differ.** They agree in about 98% of cells. The rest are notices re-issued in the DOF under a new number (seen for 2014 and 2020–21).
- **The sources can differ on an RFC.** Note 5801999 prints `HEAP5602278N7`; the CSV has `HEAP5602078N7` for the same position in the list (*re-checked*). Under the deduplication rules of the design these are two distinct records and nothing links them.

### 2. List ↔ list

**Join key:** RFC, trimmed and upper-cased. Never the name: after basic normalisation, company names match in about two thirds of cross-list pairs, and individuals' names are written surname-first in 69-B and given-name-first elsewhere.

Distinct valid RFCs shared between list families (diagonal = family size):

| | 69-B | Firmes | Exigibles | No loc. | Cancelados | CSD | Art. 74 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **69-B** | 14,830 | 2,407 | 95 | 1,599 | 1,649 | 633 | 104 |
| **Firmes** | | 264,207 | 1,612 | 3,277 | 7,805 | 17,946 | 4,984 |
| **Exigibles** | | | 2,747 | 59 | 59 | 544 | 184 |
| **No localizados** | | | | 53,346 | 1,988 | 693 | 200 |
| **Cancelados** | | | | | 182,297 | 1,014 | 13,910 |
| **CSD sin efectos** | | | | | | 58,939 | 2,481 |
| **Art. 74** | | | | | | | 68,395 |

Of 610,730 valid RFCs, 552,299 are in one family, 53,549 in two, 4,478 in three and 404 in four or more.

**Order of events for a 69-B taxpayer** (median gap from the first presumption date): No localizados comes about 107 days before, Firmes about the same time, CSD cancellation about 65 days after, and Cancelados about 454 days after. Two limits apply: 79.6% of No localizados rows carry the floor date 01/01/2014, and CSD dates only start in 2022.

**Worked example.** RFC `GFG121022JA8`:

1. No localizados, first published 16/11/2016.
2. Firmes, 01/02/2017.
3. 69-B presumption, notice `500-05-2017-2630`, DOF 25/04/2017.
4. 69-B definitive, notice `500-05-2018-8181`, DOF 17/04/2018.
5. Cancelados "por insolvencia", cancelled 04/10/2019, amount 15,430.
6. CSD sin efectos, cancelled 10/11/2023.

### 3. 69-B stage ↔ stage

Each row holds up to four stages, each with a SAT notice, a SAT page date, a DOF notice and a DOF date. Order the stages by date, not by column position: in 34 rows the "desvirtuado" date falls after the "definitivo" date.

| Path (by SAT page date) | Rows |
| --- | --- |
| Presumption → definitive | 12,072 |
| Presumption → definitive → favourable ruling | 1,521 |
| Presumption only | 878 |
| Presumption → desvirtuado | 320 |
| Presumption → favourable ruling | 103 |
| Other orders | 36 |

Median days between stages: presumption → definitive 205; presumption → desvirtuado 316; definitive → favourable ruling 903. SAT page → DOF publication: 21 to 27 days as a median over all years.

A notice is a batch: 184 presumption notices (median 41 taxpayers each, up to 462) and 342 definitive notices (median 17.5). One regular expression covers all 61,325 notice cells after splitting multi-notice cells on `//`, ` / ` or ` - `.

### 4. DOF edition → note

- `/diarios/porFecha/{date}` gives the editions of a day (morning, evening, extraordinary), each with a `codDiario`.
- `/notas/{date}` gives the notes in three arrays, one per edition. The edition is implied by the array; the list has no `codEdicion` field.
- `/diarios/{year}` returns only evening editions (90 rows for 2026; *re-checked*). It is not a calendar of publication days.
- The same field name means different things in the two responses: in the list, `codOrgaUno` is a code (`PE`, `OA`…) and `nombreCodOrgaUno` is the name; in the detail, `codOrgaUno` holds the name.
- 6–17% of notes per day have no `titulo` and no body. They are headings for a group of notes (*inference*), not documents.
- Empty values arrive in three forms: missing key, the string `"null"`, and JSON null.

### 5. Indicator ↔ Banco de México note

**Join key:** publication date. The indicator value equals the figure printed in that day's note.

| Code | Indicator | Value format | Frequency |
| --- | --- | --- | --- |
| 158 | Exchange rate (FIX) | `"18.1128"` | Each publication day |
| 159 | UDI | `"8.851528"` | Every calendar day |
| 163 | Cost of funds in dollars (CCP) | `"6.13%"` | Monthly |
| 165, 166, 174 | TIIE at 28, 91, 182 days | `"6.7559%"` | Each publication day |
| 175 | Funding TIIE | `"6.50%"` | Each publication day |

No endpoint returns indicator names; the mapping above was confirmed by equal values on 09-10 and 12-11-2026. The exchange rate and TIIE are keyed by the DOF publication date (the 09-10 value was set on 8 October); UDI is keyed by the day it applies to. `/indicadores/{code}/{from}/{to}` is inclusive and returned 6,757 rows for the exchange rate back to 05-09-2006.

### 6. Other recurring DOF notices with reference values

| Notice | Issuer | Title starts with | Seen |
| --- | --- | --- | --- |
| Fuel-tax stimulus percentages | SHCP | "Acuerdo por el que se dan a conocer los porcentajes, los montos del estímulo fiscal" | Every Friday sampled |
| UDI table (15 daily values) | Banco de México | "Valor de la unidad de inversión" | Twice a month (*inference*) |
| Inflation index (INPC) | INEGI | "Índice nacional de precios al consumidor" | Monthly |
| UMA | INEGI | "Unidad de medida y actualización" | Yearly, in January |
| RMF and annexes | SHCP | contains "Resolución Miscelánea Fiscal para" | 28-12-2025 and amendments |
| Digital service providers list | SHCP | contains "Prestadores de Servicios Digitales" | 18-09-2026 |

The RMF main text and its Anexo 1 are not in the API as text: the body is a 459-byte "download the file" stub (*re-checked*). Other annexes do arrive as HTML (4.2 MB for one note). Surcharge-rate notices were not observed.

### 7. Statistics ↔ lists

The count series `FORMATO_32_ContribIncumplidos.xls` for 2026 Q3 equals the 69-B complete list exactly: 15,013 presumed and 13,712 with a definitive date. It does not match the article 69 lists (for example 720,735 "Firmes" against 264,209 rows); the series appears to count every taxpayer ever published while the files hold the current ones (*inference*). Use it as a cross-check for 69-B only.

### 8. Statistics ↔ statistics

There are 60 distinct series files: 58 in the statistics sections and 2 counts of information requests. Most share one grid of 201 months (January 2010 to September 2026).

| Check | Result |
| --- | --- |
| Tax revenue total = sum of its taxes | Holds for 201 of 201 months |
| Active taxpayers = total by taxpayer type | Holds exactly, 201 of 201 |
| Sum of 33 state columns = active taxpayers | 199 of 201 |
| Sum of regimes = active taxpayers | Does not hold by design: one taxpayer can have several regimes (104–108%) |
| Payments by channel = total | Holds, 201 of 201 |
| Import duty in the foreign-trade file = import tax in the revenue file | Does not hold; different measures |

Reading hazards: some columns are cumulative within the year, three files change granularity partway through (year → month, fortnight → quarter, semester → quarter), and "preliminary" is a footnote for the whole file, never a mark on a period.

### 9. CFDI catalog ↔ catalog

| From | To | How | Verified |
| --- | --- | --- | --- |
| `c_UsoCFDI` | `c_RegimenFiscal` | The "Régimen Fiscal Receptor" cell is a comma-separated list of regime codes | Every code resolves |
| `c_CodigoPostal` (2 sheets) | `c_Estado`, `C_Municipio`, `C_Localidad` | State code; municipality and locality are composite with the state | All resolve; municipality is filled for only 34% of postal codes |
| `C_Colonia` (3 sheets) | `c_CodigoPostal` | Postal code | 145,366 of 145,366 |
| `c_NumPedimentoAduana` | `c_Aduana`, `c_PatenteAduanal` | Codes | 59,063 of 59,063 |
| `c_TasaOCuota` | `c_Impuesto`, `c_TipoFactor` | By text, not by code | 18 of 19 and 19 of 19 |

**Worked example.** Postal code 06600 → state `CMX`, municipality 015 Cuauhtémoc, locality 06, neighbourhood 0930 Juárez.

Codes that look numeric are stored as numbers (`1.0` for `01`, `601.0` for `601`); they must be zero-padded to the catalog's width before joining. No sheet has an end-of-validity date filled in.

### 10. State names across sources

The lists use 38 spellings for the state. After removing accents and case, a short alias table maps them to the catalog's state codes: `COAHUILA DE ZARAGOZA`, `MICHOACAN DE OCAMPO`, `VERACRUZ DE IGNACIO DE LA LLAVE` (also truncated to `…LA LLAV`), and `ESTADO DE MEXICO` against `MEXICO`. The statistics files use the short names; the charities directory uses the long ones.

### 11. Charities directory ↔ lists

**Join key:** RFC (fourth column of the sheet "Autorizadas"; header on sheet row 31, data from row 32).

1,186 of the 10,507 charities appear on some list: 792 in Reducción de multas, 363 in Firmes, 39 in CSD sin efectos, 22 in No localizados. None is in any 69-B list. Two thirds of that overlap is the fine-reduction list, which records a benefit the SAT granted, not a default (see the glossary). An organisation has two rows when it also holds the authorisation to receive donations from abroad (activity "M").

The file dates from 2025 and includes legal representatives' names, telephone numbers and e-mail addresses.

## What the data can and cannot answer

**Can answer:**

- Whether an RFC is on any list, on which ones and in what order.
- The 69-B stage of a taxpayer, with the notice and both publication dates for each stage.
- Which taxpayers a given DOF notice added, and what changed since a date (by comparing downloads).
- Cancelled, reduced or condoned amounts where the list discloses them.
- Exchange rate, UDI and TIIE for any date since 2006, and the weekly fuel-tax stimulus.
- Registry, revenue, refund, audit and collection figures by month since 2010.
- The meaning of a CFDI code and which codes it may combine with.

**Cannot answer:**

- Why a taxpayer was presumed or a debt cancelled.
- Amounts for 69-B, Firmes, No localizados, Exigibles or CSD.
- Exact event dates for article 69 lists: their dates fall on a handful of quarterly batch days.
- When a taxpayer left a list, except by comparing downloads.
- Which debt in one list corresponds to which row in another; there is no debt identifier.
- The regime, activity or address of an RFC.
- The currency of the amounts (pesos is an assumption).

## Hazards for parsers and tools

- **Amount of 0 or blank means "not disclosed".** In the generic "Cancelados" category 35,162 of 46,069 rows are 0. Amount formats differ by file (thousands commas, `.00` decimals, or plain digits).
- **Duplicates without an identifier** in Reducción de multas, Sentencias and Cancelados. The design collapses them into one record with a count.
- **Person-type labels** come in three spellings (`M`/`F`, "Persona Moral/Física", "Persona moral/fisica"), and 374 rows of Reducción de multas say `M` for a 13-character RFC.
- **Whitespace noise:** 1,286 names in 69-B have leading or trailing spaces; notice cells carry stray spaces, a trailing `?` or a parenthetical remark.
- **Placeholder RFCs** in the historic files (`SRFC`, `PPT`, `SPF`, `EXTR`), besides the 1,146 incomplete ones.
- **One undefined byte** (0x8D) in the CSD file: strict Windows-1252 decoders reject it, the browser-standard decoder that Bun uses accepts it.
- **DOF note HTML** wraps every word in its own `<span>` (about 20,000 in one note) and repeats the list in several tables; strip `<style>` and `<title>` before reading text.
- **DOF size fields are wrong:** `tamanioContenido` was 2 and `tamanioExcesivo` false for a 2.3 MB note.

## Not checked

- 49 Bis beyond one notice (one entity; its RFC is not in 69-B).
- The DOF document and PDF endpoints, which the RMF text depends on.
- The UMA value, surcharge-rate notices, and the other notices of 23 October.
- Whether header cells in the statistics files are merged.
- The 20 yearly charity reports beyond one sample.
