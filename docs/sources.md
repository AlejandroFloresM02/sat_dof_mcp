# Source reference: SAT lists, DOF API and CFDI service

What each public source serves, how it behaves over HTTP, and how often it changes. Companions: [design_connector.md](design_connector.md) (what is built on these sources), [data_relationships.md](data_relationships.md) (how the sources join), [glossary.md](glossary.md) (legal meaning of the terms).

**Measurement dates.** Figures come from two sessions: 25 October 2026 (the 22 lists, the DOF notes of 2026, speeds) and 13 November 2026 (re-probes with `curl`, DOF editions and indicators). Each section states its date. The lists change every few weeks, so counts describe the snapshot of 25 October unless stated otherwise.

## SAT taxpayer lists

All 22 lists are linked from one page: [Datos abiertos SAT · Contribuyentes publicados](https://www.sat.gob.mx/minisitio/DatosAbiertos/contribuyentes_publicados.html). The files are served from `https://wu1agsprosta001.blob.core.windows.net/agsc-publicaciones/Datos_abiertos/`; the tables give the path after that prefix.

The files are text CSV in Windows-1252. The server labels them `application/vnd.ms-excel`, but they are not Excel files.

All 22 were downloaded in full on 25 October 2026: 79.7 MB, 738,602 records, 611,724 distinct RFCs across the lists. The converted UTF-8 copies are in `docs/sat_listas_utf8_2026-10-25/csv/`, and the raw bytes of 15 of them in `docs/sat_listas_raw_2026-10-25/`.

### File addresses

**Article 69-B (invoices for non-existent operations).** Page cutoff on 25 October: 30 September 2026.

| File | Path |
| --- | --- |
| Listado completo | `Documents_AGAFF/Listado_completo_69-B.csv` |
| Definitivos | `Documents_AGAFF/Definitivos.csv` |
| Desvirtuados | `Documents_AGAFF/Desvirtuados.csv` |
| Presuntos | `Documents_AGAFF/Presuntos.csv` |
| Sentencias favorables | `Documents_AGAFF/SentenciasFavorables.csv` |

**Article 69-B Bis (improper transfer of tax losses).** Page cutoff on 25 October: 9 October 2026.

| File | Path |
| --- | --- |
| Listado completo | `Documents_AGGC/Listado_69_B_Bis_Completo.csv` |
| Definitivos | `Documents_AGGC/Listado_69_B_Bis_Definitivo.csv` |
| Sentencias favorables | `Documents_AGGC/Listado_69_B_Bis_SentenciaFa.csv` |

**Article 69 (non-compliant taxpayers).** Page cutoff on 25 October: 1 July 2026. On 13 November the page showed 1 October 2026, and seven of these lists had been re-uploaded on 4 and 12 November.

| File | Path |
| --- | --- |
| No localizados | `Documents_AGR/No_localizados.csv` |
| Exigibles | `Documents_AGR/Exigibles.csv` |
| Firmes | `Documents_AGR/Firmes.csv` |
| Cancelados | `Documents_AGR/Cancelados.csv` |
| Sentencias | `Documents_AGR/Sentencias.csv` |
| CSD sin efectos | `Documents_AGR/CSDsinefectos.csv` |
| Entes públicos y de gobierno omisos | `Documents_AGR/EntespublicosydeGobiernoomisos.csv` |
| Reducción de multas (art. 74) | `Documents_AGR/ReduccionArt74CFF.csv` |
| Condonados concurso mercantil (art. 146-B, repealed in 2021; historical) | `Cifras_SAT/Indef/Condonadosart146BCFF.csv` |
| Reducción de recargos (art. 21) | `Cifras_SAT/Indef/Condonadosart21CFF.csv` |
| Condonados por decreto 2015 | `Cifras_SAT/Indef/CondonadosporDecreto.csv` |
| Condonados 2007–2015 | `Cifras_SAT/Indef/Condonados_07_15.csv` |
| Cancelados art. 146A 2007–2015 | `Cifras_SAT/Indef/Cancelados_07_15.csv` |
| Retorno de inversiones | `Cifras_SAT/Indef/Retornoinversiones.csv` |

The same section links two files that are not RFC lists: a technical note (`Cifras_SAT/Indef/causasymotivos.xls`) and the count series `FORMATO_32_ContribIncumplidos.xls`. The series was at `AGR/03_02_26/` on 25 October and at `Documents_AGR/` on 13 November.

Addresses move, so the design resolves them from the page links and does not hardcode them.

### Structure

The 69-B and 69-B Bis files carry 2 preamble rows before the header: a notice with the cutoff date, and the title. The article 69 files start at the header.

| File | Columns | Records | Distinct RFCs | Publication dates in the data |
| --- | --- | --- | --- | --- |
| 69-B Listado completo | 20 | 15,013 | 14,831 | 10/01/2014 to 09/10/2026 |
| 69-B Definitivos | 20 | 12,128 | 12,041 | 10/01/2014 to 09/10/2026 |
| 69-B Sentencias favorables | 20 | 1,667 | 1,646 | 10/01/2014 to 07/08/2026 |
| 69-B Presuntos | 20 | 878 | 864 | 10/01/2014 to 09/10/2026 |
| 69-B Desvirtuados | 20 | 340 | 340 | 10/01/2014 to 06/03/2026 |
| 69-B Bis Listado completo | 12 | 3 | 3 | 25/01/2024 to 09/10/2026 |
| 69-B Bis Sentencias favorables | 12 | 2 | 2 | (inside the complete list) |
| 69-B Bis Definitivos | 12 | 1 | 1 | (inside the complete list) |
| 69 Firmes | 6 | 264,209 | 264,209 | 01/01/2014 to 01/07/2026 |
| 69 Cancelados | 8 | 184,837 | 182,297 | 01/02/2014 to 01/07/2026 |
| 69 Reducción de multas (art. 74) | 8 | 106,666 | 68,400 | 16/02/2014 to 19/01/2024 |
| 69 CSD sin efectos | 6 | 59,636 | 58,939 | 23/07/2024 to 01/07/2026 |
| 69 No localizados | 6 | 53,346 | 53,346 | 01/01/2014 to 01/07/2026 |
| 69 Cancelados art. 146A 2007–2015 | 7 | 23,004 | 21,707 | Column `Año`: 2007 to 2015 |
| 69 Condonados 2007–2015 | 7 | 10,215 | 8,083 | Column `Año`: 2007 to 2015 |
| 69 Entes públicos omisos | 6 | 3,200 | 412 | 23/07/2024 to 01/07/2026 |
| 69 Exigibles | 6 | 2,747 | 2,747 | 01/01/2014 to 01/07/2026 |
| 69 Sentencias | 6 | 610 | 572 | 01/01/2014 to 01/04/2026 |
| 69 Retorno de inversiones | 8 | 73 | 73 | 01/05/2016 to 18/10/2016 |
| 69 Condonados concurso mercantil (146-B) | 8 | 16 | 16 | 16/01/2016 to 16/09/2018 |
| 69 Condonados por decreto | 8 | 7 | 7 | 16/03/2014 to 16/07/2016 |
| 69 Reducción de recargos (art. 21) | 8 | 4 | 4 | 01/03/2016 to 01/07/2020 |

### Headers

- **69-B (20 columns):** `No`, `RFC`, `Nombre del Contribuyente`, `Situación del contribuyente`, then 4 columns for each stage (presunción, desvirtuados, definitivos, sentencia favorable): notice number and date at the SAT, publication date on the SAT page, notice number and date in the DOF, and publication date in the DOF.
- **69-B Bis (12 columns):** the same idea with 2 stages (definitivo and sentencia favorable).
- **No localizados, Exigibles, Firmes:** `RFC`, `RAZON SOCIAL`, `TIPO PERSONA`, `SUPUESTO`, `FECHA DE PRIMERA PUBLICACION`, `ENTIDAD FEDERATIVA`.
- **Sentencias:** the same 6, spelled `RAZÓN SOCIAL` and `FECHAS DE PRIMERA PUBLICACION`.
- **Cancelados:** `RFC`, `RAZON SOCIAL`, `TIPO PERSONA`, `SUPUESTO`, `FECHA DE CANCELACION`, `MONTO`, `FECHA DE PUBLICACION`, `ENTIDAD FEDERATIVA`.
- **Reducción de multas (art. 74):** as Cancelados, with `FECHA DE AUTORIZACIÓN` in place of the cancellation date, and the name as `NOMBRE, DENOMINACIÓN O RAZÓN SOCIAL`.
- **CSD sin efectos:** `RFC`, `NOMBRE O RAZON SOCIAL`, `SUPUESTO DE CANCELACION CSD`, `FECHA DE CANCELACION CSD`, `ADMINISTRACION GENERAL RESPONSABLE DE LA CANCELACION`, `FECHA DE PUBLICACION`.
- **Entes públicos omisos:** `RFC`, `RAZON SOCIAL`, `SUPUESTO`, `EJERCICIO`, `PERIODO`, `FECHA DE PRIMERA PUBLICACION`.
- **Condonados 146-B, por decreto, recargos art. 21, Retorno de inversiones:** `RFC`, `RAZÓN SOCIAL`, `TIPO PERSONA`, `SUPUESTO`, `FECHAS DE PRIMERA PUBLICACION`, `MONTO`, a publication date "con monto de acuerdo a la Ley de Transparencia", and `ENTIDAD FEDERATIVA`.
- **Historic 2007–2015:** `Año`, `Tipo de persona`, `RFC`, `Contribuyente`, `Importe condonado` (or `IMPORTE`), `Motivo de condonación` (or `MOTIVO`), `Entidad Federativa`.

The name column has 7 different headers across the 22 files: `Nombre del Contribuyente`, `RAZON SOCIAL`, `RAZÓN SOCIAL`, `NOMBRE O RAZON SOCIAL`, `NOMBRE, DENOMINACIÓN O RAZÓN SOCIAL`, `Contribuyente` and `CONTRIBUYENTE`.

The four 69-B sub-lists end with 4 or 5 unnamed columns. They are empty in every row and the conversion dropped them.

### Category values

| Field | Values |
| --- | --- |
| Situación (69-B) | Definitivo 12,128 · Sentencia Favorable 1,667 · Presunto 878 · Desvirtuado 340 |
| Situación (69-B Bis) | Sentencia Favorable 2 · Definitivo 1 |
| `SUPUESTO` in Cancelados | Cancelados por insolvencia 70,643 · Cancelados por incosteabilidad 68,125 · Cancelados 46,069 |
| `SUPUESTO` in the other article 69 files | One value per file (for example `FIRMES`, `NO LOCALIZADOS`, `FRACCION X` in CSD, `FRACCION VII` in entes omisos) |
| `TIPO PERSONA` | `F` or `M` |
| `ENTIDAD FEDERATIVA` | 32 values in No localizados and in Cancelados |

The 69-B complete list (15,013) is exactly the sum of its four sub-lists.

### Sample records

**69-B:**

| RFC | Name | Situación | Presumption notice | DOF presumption | Definitive notice | DOF definitive |
| --- | --- | --- | --- | --- | --- | --- |
| AAA120730823 | ASESORES Y ADMINISTRADORES AGRICOLAS, S. DE R.L. DE C.V. | Definitivo | 500-05-2016-38728 de fecha 16 de diciembre de 2016 | 19/01/2017 | 500-05-2018-14172 de fecha 25 de mayo de 2018 | 28/06/2018 |
| AAP200401PB5 | APEC AGENCIA PUBLICITARIA EMPRESARIAL Y CORPORATIVA, S.A. DE C.V. | Presunto | 500-05-00-00-00-2026-21664 de fecha 10 de julio de 2026 | 18/09/2026 | | |

**69-B Bis:**

| RFC | Name | Situación | Definitive notice | SAT page | DOF |
| --- | --- | --- | --- | --- | --- |
| OAN151230HWA | OPERADORA AUTOPISTAS NACIONALES EQUIVENT, S.A. DE C.V. | Sentencia Favorable | 900-04-00-00-00-2024-80 de 25 de enero de 2024 | 25/01/2024 | 05/07/2024 |

The same record also carries the favourable-ruling stage: notice 900 04 00 00 00 2026-254 of 12 March 2026, published in the DOF on 05/06/2026.

**Article 69:**

| File | RFC | Name | Supuesto | Dates | Other fields |
| --- | --- | --- | --- | --- | --- |
| No localizados | DMC990622AG8 | 2 M CONSTRUCTORA SA DE CV | NO LOCALIZADOS | First published 01/01/2014 | CIUDAD DE MEXICO |
| Cancelados | &HI0102165P2 | A & H INCENTIVE GROUP SA DE CV | CANCELADOS POR INSOLVENCIA | Cancelled 28/05/2019 · published 20/08/2019 | Amount 1,390,273 · BAJA CALIFORNIA SUR |
| CSD sin efectos | GTM870825HA7 | GRUPO TMM S A B | FRACCION X | CSD cancelled 05/01/2024 · published 23/07/2024 | AGGC |
| Entes omisos | MZA850101LF7 | MUNICIPIO DE ZACUALPAN SIN TIPO DE SOCIEDAD | FRACCION VII | First published 23/07/2024 | Ejercicio 2021 · periodo 9 |

### Data-quality problems

| Problem | Where | How many | Handling |
| --- | --- | --- | --- |
| RFC suppressed by court order (`XXXXXXXXXXXX`); the name holds the text of the ruling | 69-B | 91 rows (73 definitivos, 15 presuntos, 3 sentencias favorables) | Cannot be found by RFC or by name. The design keeps them as records and counts them in every negative answer |
| The same RFC in several rows with a different status (another procedure) | 69-B | 84 RFCs | A lookup returns every row |
| Dates that are not `DD/MM/YYYY`: an Excel serial (`44014`) or a range (`25/05/2022 - 26/04/2021`) | 69-B publication columns | 196 cells | Convert the serial; keep the range as text plus its 2 dates |
| RFC with lowercase letters (`BSi1905214W5`) | Reducción de multas | 22 | Upper-case |
| Incomplete RFCs (3 to 10 characters) | Cancelados art. 146A 2007–2015 | 1,146 | Search that file by name only |
| Misspelled generic RFC (`XAXX01101000`) | Firmes | 2 | Ignore |
| Header cutoff date earlier than the data | 69-B says "30 de septiembre" but carries DOF publications up to 9 October | Whole file | Report the declared cutoff and the latest date found in the data |
| Company names split across 2 lines inside a quoted field | Several lists | Not counted | Quote-aware parsing |
| Amounts as text with thousands commas (`1,390,273`); no currency column | Files with `MONTO` or `Importe` | All | Parse as number; pesos is an assumption |

**Encoding.** In the two 2007–2015 files, 147 characters arrive in CP850 inside a Windows-1252 file: `COMPA¥IA` for `COMPAÑIA`, and a control byte in `MÉXICO`. Four characters were repaired after reading examples of each: `¥`→Ñ, `¤`→ñ, `µ`→Á, byte 0x90→É. Three names are wrong at the source and were left as they are: `CARRE±O`, `ZU¥IGA` and `INGENIERÃ­A`, one each in Firmes, Cancelados and CSD sin efectos.

**Conversion check (25 October).** Every row has its header's field count and no quote is left open. Each converted file was read back and compared field by field with the original: 0 differences in 738,602 rows.

### What the files do not contain

Address, economic activity, legal representative, the detailed reason for a 69-B listing, and the person type in 69-B. The 69-B files also have no state column; CSD sin efectos and entes omisos have none either. Person type could be derived from the RFC length (12 characters for an entity, 13 for an individual), but that would be this project's rule, not SAT data.

Taxpayers who deducted invoices from listed issuers (EDOS) have no separate file in the open-data page. Whether they are inside any article 69 file is not known.

## SAT file storage: HTTP behaviour

Measured on 25 October 2026 against Azure storage.

- A `HEAD` returns `ETag`, `Last-Modified` and `Content-MD5` for all 22 files. In 3 files checked, `Content-MD5` was the real MD5 of the downloaded bytes.
- A conditional `GET` with `If-None-Match` or `If-Modified-Since` returns `304 Not Modified`.
- `Range` is accepted. The first 200 bytes arrive in 76 ms, enough to read the cutoff notice ("Información actualizada al") of 69-B and 69-B Bis without downloading the file.
- The container cannot be listed (404). A new or renamed file is found only by reading the links on the open-data page.
- A changed hash does not mean new publications. The article 69 files changed on 19–22 October without the quarterly batch. Knowing what changed requires comparing against the previous download.
- The server uses version `2009-09-19` of the Azure API. If the SAT changes how it uploads, `Content-MD5` could disappear; `ETag` and the conditional `GET` are the fallback.

## DOF API

A read-only REST API (GET, JSON) with no authentication. The official documentation ([SIDOF · Datos abiertos](https://sidof.segob.gob.mx/datos_abiertos)) points to the test host `sidofqa.segob.gob.mx`; the production host `sidof.segob.gob.mx` answers the same routes. The documents mention no token, registration or usage limits.

It is the only verified source for article 49 Bis, which has no CSV on the SAT open-data page.

Prefix: `https://sidof.segob.gob.mx/dof/sidof`

| Service | Endpoint | Parameters | Tested |
| --- | --- | --- | --- |
| Notes by date | `/notas/{fecha}` | `DD-MM-YYYY` | 25 October |
| Note by code | `/notas/nota/{codNota}` | 7 digits | 25 October |
| Notes by edition | `/notas/obtenerNotasPorDiario/{codDiario}` | 6 digits | No |
| Editions by date | `/diarios/porFecha/{fecha}` | `DD-MM-YYYY` | 13 November |
| Editions by year | `/diarios/{año}` | 4 digits | 13 November; returns evening editions only |
| Edition by date and type | `/diarios/obtieneDiario/{fecha}/{edicion}` | `MAT`, `VES` or `EXT` | No |
| Word document of a note | `/documentos/doc/{codNota}` | 7 digits | No |
| PDF of the edition | `/documentos/pdf/{codDiario}` | 6 digits | No |
| Indicators | `/indicadores/{fecha}` and `/indicadores/{code}/{from}/{to}` ([PDF](https://sidof.segob.gob.mx/datos_abiertos/getPDF/61)) | Date; code and inclusive range | 13 November |

Requests made on 25 October:

- `/notas/10-07-2026` returned 88 notes, among them the 3 notices of article 49 Bis (codes 5793257, 5793258, 5793259).
- `/notas/03-07-2026` returned 82 notes, among them 2 "listado global definitivo en términos del artículo 69-B" and 2 lists of taxpayers who filed a defence.
- `/notas/nota/5793257` returned the full notice. The text is HTML inside `cadenaContenido`; RFC and name are extracted from it.
- All 298 dates from 1 January to 25 October: 20,940 notes.

Format and behaviour:

- A successful response carries `messageCode: 200` in its body.
- Empty fields can arrive as the string `"null"`. `tamanioContenido` is not reliable (0 or 2 for notes with megabytes of content).
- 2,373 of the 20,940 notes of 2026 (11%) have no `titulo`. A filter on the title does not see them.
- The API returns no `ETag`, no `Last-Modified` and no compression, and has no "changes since" query. The only way to find new notes is to request the day's date.
- Editions are morning (`MAT`), evening (`VES`) and extraordinary (`EXT`). The documentation says there is normally no publication on weekends or public holidays.
- The response carries `Access-Control-Allow-Origin: *` and lists `X-Auth-Token` among the allowed headers, though every call worked without it.
- The status page `/apiStatus` returned an error.
- 4 requests in parallel ran without errors over 298 calls. With no documented limit, there is no evidence that more is safe.
- A list note weighs several megabytes, so a note detail needs a timeout of at least 60 s.

Note 5801999 is a **presumption** notice (171 RFCs). A definitive-list example is note 5792569.

## CFDI status service (SOAP)

Checks one invoice against the SAT. Since late 2020 it also returns the field `ValidacionEFOS`.

- Service `ConsultaCFDIService`, operation `Consulta`.
- SOAPAction `http://tempuri.org/IConsultaCFDIService/Consulta`.
- Endpoint `https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc`.
- Input: the expression `?re=<issuer RFC>&rr=<receiver RFC>&tt=<total>&id=<UUID>`.
- Output: `CodigoEstatus`, `Estado`, `EsCancelable`, `EstatusCancelacion`, `ValidacionEFOS`.

The service description (WSDL) was read and is valid. No real query has been made, because it needs an existing invoice; its latency is unmeasured. References: [SAT documentation](https://www.sat.gob.mx/minisitio/Factura/documentos/cancelacion/consulta_cfdi.pdf), [phpcfdi/sat-estado-cfdi](https://github.com/phpcfdi/sat-estado-cfdi).

## Publication cadence

No source publishes a calendar. The cadence below was measured on 25 October 2026 in the data and in the DOF API, and can change without notice.

- **The freshest source for 69-B is the SAT page:** presumptions once a month and definitives twice a month. The DOF prints the same notices 7 to 9 weeks later.
- **Article 69 is quarterly.** RMF 2026 rule 2.9.15 orders the quarterly refresh (see the [glossary](glossary.md)). No rule was found for the 69-B cadence: rules 1.2, 1.4 and 1.5 do not deal with the lists, and in October the RMF 2026 text was read only up to rule 2.1.12.

| Source | Cadence observed in 2026 | Evidence |
| --- | --- | --- |
| 69-B presumptions, SAT page | 1 batch a month: 23/01, 18/02, 10/03, 08/04, 08/05, 05/06, 10/07, 07/08, 04/09 | SAT-page publication dates in the CSV. The file modified on 16 October had no October batch yet |
| 69-B definitives, SAT page | 2 batches a month, in pairs a week apart (for example 15/09 and 22/09) | 18 distinct dates in 2026 |
| 69-B favourable rulings | Irregular: 20/02, 08/05, 11/05, 10/07, 07/08 | 5 dates in 2026 |
| 69-B desvirtuados | None in 2026; the last on the SAT page was 24/11/2025 | CSV |
| 69-B in the DOF | 12 days with publications: 20/02, 06/03, 13/03, 30/04, 15/05, 05/06, 26/06, 03/07, 24/07, 18/09, 09/10 and 23/10 | All 298 dates from 1 January to 25 October in the API |
| Lag from SAT page to DOF | Presumption: median 63 days (49 to 71). Definitives: median 53 days (32 to 70). In 2025 it was 51 and 45 days | Both dates in the CSV |
| 69-B Bis | DOF: 05/06 and 09/10. CSV: 3 records | DOF API and CSV |
| 49 Bis | DOF: 10/07, 07/08, 14/08 and 28/08 (14 notices). No CSV exists. The content of one notice was read (5793257); the rest were seen only in the daily lists | DOF API |
| Article 69 (firmes, no localizados, exigibles, cancelados, CSD) | Quarterly, on the 1st of January, April, July and October: all 7 dates since 2025 fall there | On 25 October the 1 October batch was not yet in the files, although they had been modified on 19–22 October |
| Historic files (2007–2015, condonados, recargos, retorno de inversiones) | No changes: last modified 16 April 2026, publication dates ending between 2016 and 2024 | HTTP headers |

**Cross-check.** Notice 500-05-00-00-00-2026-24732 was published on the SAT page on 04/09/2026 and in the DOF on 23/10/2026. The CSV of 16 October already has its 171 taxpayers, with no DOF date. The HTML of that DOF note (code 5801999) holds exactly 171 RFCs.

The DOF dates in the CSV are filled only when the SAT uploads the file again, so they lag the DOF itself.

## Measured speed

Measured on 25 October 2026 from a browser on the developer's machine and network. Other networks will differ.

| Operation | Result |
| --- | --- |
| `HEAD` of 1 SAT file | 0.35 s |
| `HEAD` of the 22 files in parallel | 0.49 s |
| `Range` of 200 bytes | 0.08 s |
| `GET` of the 22 files in parallel (79.7 MB) | 8.0 s, about 80 Mbps |
| `GET` of the 22 files in sequence | 14.3 s |
| DOF `/notas/{fecha}`, 298 dates, 4 in parallel | 13.2 s in total, 0 errors; median 165 ms, p95 286 ms, maximum 438 ms; 28 KB on average |
| DOF `/notas/nota/5801999` (69-B list of 171 RFCs) | 10.0 s and 3.2 MB, of which 2.2 MB are HTML |

Walking the DOF note lists for all of 2026 took 13 s; the heavy part of a first load is the detail of the list notes.

## Limits

- **No official calendar and no availability commitment.**
- **Cutoff dates are unreliable.** The 69-B notice said 30 September while the data reached 9 October.
- **Article 69 data can be more than 3 months old.**
- **Fragile paths.** Without a container listing, a new or renamed file goes unnoticed unless the page links are compared. Some paths carry a dated folder (for example `AGR/03_02_26/`).
- **Format without a contract.** Wrong `Content-Type`, Windows-1252 with CP850 fragments in the historic files.
- **DOF API.** Documentation points to the test host, `/apiStatus` fails, no documented limits, and list notes arrive as large HTML whose structure can change.
- **Network.** On 25 October a cloud environment could not reach the SAT storage host, so an office network could block it too.

## What to watch

Polling intervals are set in the design's "Change detection per host". These are the checks and their starting thresholds.

| Watch | How | Starting threshold |
| --- | --- | --- |
| Schema of each file | Compare headers with the documented ones (20, 12, 6 to 8 columns) | Any difference stops that file's load |
| 69-B integrity | The complete list must equal the sum of the 4 sub-lists | Any difference |
| Volume | Row change against the previous download | Configurable; start with a 5% drop |
| 69-B freshness | Days without a new presumption date on the SAT page | Alert at 45 days (monthly today) |
| Article 69 freshness | Days since the last quarterly date | Alert at 100 days |
| New or renamed files | Compare the links on the open-data page | Any difference |
| DOF parser | Tests with real notes: 5793257 (49 Bis) and 5801999 (69-B presumption, 171 RFCs) | Every release |
| DOF notes without a title | Sample their content | Monthly at first |
| Encoding | Count suspicious characters (`¥`, `Ã`, control characters) after converting | Any increase |
| Legal changes | 49 Bis arrived with the CFF reform in force since 1 January 2026. Reforms like it can add or change lists | Review each year between November and January (budget package and new RMF) |

## Not verified

| Topic | What happened | What is missing |
| --- | --- | --- |
| Notifications by estrados | The official query page (`sat.gob.mx/consultas/43671`) failed to load, and the notifications page blocks automated access | Whether a downloadable list or an API exists. A 2015 article describes a web list with .zip files of images |
| Article 49 Bis on the SAT portal | Several sources say it is published on the SAT portal and in the DOF. It was not found in the open-data page or elsewhere on the SAT site | The DOF is the only verified source |
| DOF terms of use and rate limits | The documents mention neither | Keep calls few and cache locally |
| Credentialed services | Compliance opinion (32-D), tax status certificate and bulk RFC validation need the taxpayer's credentials. Stated from general knowledge | Confirm before relying on it |

## Sources consulted

- [SAT · Datos abiertos, contribuyentes publicados](https://www.sat.gob.mx/minisitio/DatosAbiertos/contribuyentes_publicados.html)
- [SAT · Documentación del servicio de consulta de CFDI v1.3](https://www.sat.gob.mx/minisitio/Factura/documentos/cancelacion/consulta_cfdi.pdf)
- [SAT · RMF 2026 as published in the DOF on 28 December 2025](https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/rmf/RMF_2026-DOF-28122025.pdf)
- [phpcfdi/sat-estado-cfdi](https://github.com/phpcfdi/sat-estado-cfdi)
- [SIDOF · Datos abiertos](https://sidof.segob.gob.mx/datos_abiertos), with the sheets for [Notas](https://sidof.segob.gob.mx/datos_abiertos/getPDF/57), [Diario](https://sidof.segob.gob.mx/datos_abiertos/getPDF/65) and [Documentos](https://sidof.segob.gob.mx/datos_abiertos/getPDF/43)
- [IDC Online · Cómo revisar una notificación por estrados (2015)](https://idconline.mx/fiscal/2015/06/22/cmo-revisar-una-notificacin-por-estrados-del-sat)
- [Incomex · Nueva lista 49 Bis (agosto 2026)](https://incomex.org.mx/index.php/2026/08/17/sat-lista-49bis-facturas-falsas/)
