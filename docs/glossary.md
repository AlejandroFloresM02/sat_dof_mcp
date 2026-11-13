# Glossary of legal terms in the SAT "published taxpayers" lists

> This is a reference for building the connector. It is not legal advice.

- **Data described:** the 22 CSV files in `docs/sat_listas_utf8_2026-10-25/csv/` (downloaded 25 October 2026).
- **Law checked on 13 November 2026:** Código Fiscal de la Federación (CFF), consolidated text of the Cámara de Diputados, "última reforma publicada DOF 09-04-2026"; Resolución Miscelánea Fiscal (RMF) for 2026 as published in the DOF on 28 December 2025.
- **"Not verified"** means the statement was not found or not read in a primary source. All such items are repeated in [Not resolved](#not-resolved).

## How to read an entry

Each entry gives the term as it appears in the data, an English rendering, the legal basis, what it means, how a taxpayer gets in, how they get out, what it means for someone doing business with them, and where it lives in this project.

- CFF links open the PDF at the page where the article starts. Paragraph and fraction numbers were counted in that text.
- The ten publication grounds of article 69 hang from its twelfth paragraph (RMF rule 2.9.16 and CFF article 17-H Bis fraction XI both cite it that way). "Art. 69 fr. III" below means that paragraph, fraction III.
- "Counterparty" lines state only effects found in the texts read. Where the texts state none, the entry says so.

## Easy to get wrong

| Pair | The difference |
| --- | --- |
| **Presunto** vs **Definitivo** (art. 69-B) | *Presunto* is an open presumption: the SAT has notified the taxpayer, who has 15 days (plus 5 on request) to rebut it. Nothing has been decided and the listing has no legal effect on the invoices yet. *Definitivo* is the outcome when the taxpayer did not rebut it: the invoices "no producen ni produjeron efecto fiscal alguno", with general effects. Never describe a *Presunto* as a taxpayer that issued simulated invoices. |
| **Firmes** vs **Exigibles** (art. 69 frs. I and II) | *Firmes*: tax debts that are final. *Exigibles*: tax debts already determined and enforceable that are neither paid nor guaranteed. An enforceable debt is not necessarily final, and the statute lists them as separate grounds. |
| **Cancelados** vs **CSD sin efectos** | *Cancelados*: the SAT wrote a **debt** off its books because collecting it was not worth the cost or the debtor was insolvent. The taxpayer is not cancelled, and the debt is still owed ("no libera de su pago", art. 146-A). *CSD sin efectos*: the taxpayer's **digital seal certificate** was voided, so it cannot issue invoices with it. Neither means the RFC registration was cancelled. |
| **Sentencias** (art. 69) vs **Sentencia favorable** (art. 69-B) | Opposite meanings. *Sentencias*: a final criminal conviction for a tax offence. *Sentencia favorable*: the taxpayer challenged a 69-B listing and a court or administrative ruling set it aside. |
| **Not on a list** vs **compliant** | Absence proves little. The files are snapshots with cutoff dates; article 69 data is refreshed quarterly (RMF rule 2.9.15); the SAT publishes only those *no localizados* who also show systematic non-compliance (rule 2.9.16); 91 rows of the 69-B file have the RFC suppressed by court order; article 49 Bis has no CSV; article 69 frs. VIII and IX have no file. Compliance is what the *opinión del cumplimiento* (CFF art. 32-D, RMF rule 2.1.36) certifies, and that needs the taxpayer's own credentials. |
| **"CONDONADOS"** vs **"reducción"** | The current text of articles 21 and 74 (paragraphs reformed DOF 12-11-2021) speaks of *reducing* surcharges and fines. The data and the SAT's technical note say *condonados* / *condonación*. Being on these lists means the SAT granted a benefit; it is not a default. |

## Article 69 fractions and their files

Only two files name their fraction (`FRACCION VII`, `FRACCION X`). The rest of the mapping follows the wording of each fraction and the SAT's technical note.

| Fr. | Ground (short) | File(s) | `SUPUESTO` value |
| --- | --- | --- | --- |
| I | Firm tax debts | `sat_69_firmes.csv` | `FIRMES` |
| II | Determined, enforceable debts not paid or guaranteed | `sat_69_exigibles.csv` | `EXIGIBLES` |
| III | Registered but not located | `sat_69_no_localizados.csv` | `NO LOCALIZADOS` |
| IV | Final conviction for a tax offence | `sat_69_sentencias.csv` | `SENTENCIAS` |
| V | Debts written off under art. 146-A | `sat_69_cancelados.csv`, `sat_69_cancelados_art146a_2007_2015.csv` | `CANCELADOS`, `CANCELADOS POR INSOLVENCIA`, `CANCELADOS POR INCOSTEABILIDAD` |
| VI | A tax debt was forgiven (*condonado*) | `sat_69_condonados_art146b.csv`, `sat_69_condonados_por_decreto.csv`, `sat_69_reduccion_recargos_art21.csv`, `sat_69_condonados_2007_2015.csv`. Placed here because the SAT note describes them as *condonación*, although no file states its fraction (not verified): `sat_69_reduccion_multas_art74.csv`, `sat_69_retorno_inversiones.csv` | `CONDONADOS`, `ARTICULO 74`, `RETORNO INVERSIONES` |
| VII | Public bodies and recipients of federal funds that omitted periodic returns | `sat_69_entes_publicos_omisos.csv` | `FRACCION VII` |
| VIII | Listed companies without their compliance certificate | No file among the 22 | — |
| IX | Taxpayers that used invoices for non-existent operations and neither proved them nor corrected (the receivers under art. 69-B) | No file among the 22 | — |
| X | CSD voided under art. 17-H frs. X, XI or XII | `sat_69_csd_sin_efectos.csv` | `FRACCION X` |

Outside article 69: five files for article 69-B, three for article 69-B Bis, none for article 49 Bis (DOF only).

**Refunds.** [RMF 2026 rules 2.3.2][rmf-232] and [2.3.11][rmf-2311] take out of the automatic or expedited refund track any claim based on invoices from issuers published under art. 69 (the fractions each rule names), on the definitive 69-B list or, in rule 2.3.11, under art. 49 Bis.

**Amounts.** Article 69 lets the SAT publish the name and RFC (plus the year and period for fr. VII). The amounts in the *Cancelados* and *Condonados* files rest on the transparency law, which orders publication of the name, RFC and amounts of written-off or forgiven tax debts ([LGTAIP][lgtaip] art. 66 fr. IV and art. 67 fr. II c)). Those are the articles of the law in force since March 2025; most rows were published under earlier transparency laws, which were not read. That is the "Ley de Transparencia" in the column header `Fecha de publicación (Con monto de acuerdo a la Ley de Transparencia`.

## The seven lists asked about

### No localizados

- **In the data:** `NO LOCALIZADOS` · **English:** not located.
- **Basis:** [CFF art. 69][cff-69] fr. III; [RMF 2026 rule 2.9.16][rmf-2915]. Tax domicile: [CFF art. 10][cff-10].
- **Meaning:** the taxpayer is registered in the RFC but the authority could not find it at its registered tax domicile.
- **Gets in:** the SAT flags it as not located and, under rule 2.9.16, it also shows systematic non-compliance. The criteria the SAT uses to flag someone are not verified.
- **Gets out:** clarification request under the last paragraph of art. 69 (decided in 3 days; the SAT removes the entry if clarified), through procedure 85/CFF ([rule 2.9.15][rmf-2915]). What the taxpayer must show is not verified.
- **Counterparty:** public bodies spending federal funds may not contract with it ([CFF art. 32-D][cff-32d] fr. V). Being not located is also a trigger for the 69-B presumption ([art. 69-B][cff-69b], first paragraph) and for a temporary CSD restriction ([art. 17-H Bis][cff-17hbis] frs. II and III). The texts read state no direct effect on its invoices.
- **In this project:** `sat_69_no_localizados.csv`, column `SUPUESTO`; 53,346 rows.

### Exigibles

- **In the data:** `EXIGIBLES` · **English:** enforceable unpaid tax debts.
- **Basis:** [CFF art. 69][cff-69] fr. II; [art. 65][cff-65]; [art. 145][cff-145].
- **Meaning:** the taxpayer has tax debts already determined by the authority that are enforceable and neither paid nor guaranteed.
- **Gets in:** a determined debt must be paid or guaranteed within 30 days after its notification takes effect (art. 65). After that the authority collects it through the enforcement procedure (art. 145).
- **Gets out:** paying or guaranteeing the debt ends the condition described in fr. II; the entry is removed through the clarification procedure.
- **Counterparty:** public bodies may not contract with it ([art. 32-D][cff-32d] fr. II) unless it signs a payment agreement. It signals active collection. No effect on its invoices is stated.
- **In this project:** `sat_69_exigibles.csv`, column `SUPUESTO`; 2,747 rows.

### Firmes

- **In the data:** `FIRMES` · **English:** final (firm) tax debts.
- **Basis:** [CFF art. 69][cff-69] fr. I. The CFF and the RMF 2026 use "crédito fiscal firme" without defining it: **definition not verified**.
- **Meaning (working):** a tax debt that can no longer be challenged, because no defence was filed in time or the defence was lost with a final decision. [RMF rule 2.1.1][rmf-211] frs. II and III describe those two situations, but not as a definition.
- **Gets in:** the debt becomes final and remains owed.
- **Gets out:** fr. I has no "unless paid" wording. Removal is through the clarification procedure; whether payment alone removes the entry is not verified.
- **Counterparty:** public bodies may not contract with it ([art. 32-D][cff-32d] fr. I) unless it signs a payment agreement. The SAT may report firm debts to credit bureaus (art. 69, first paragraph). Since 2026 an unpaid firm debt can lead to a temporary CSD restriction when the taxpayer invoiced more than four times the debt in the previous year ([art. 17-H Bis][cff-17hbis] fr. XII).
- **In this project:** `sat_69_firmes.csv`, column `SUPUESTO`; 264,209 rows, the largest list.

### Cancelados

- **In the data:** `CANCELADOS`, `CANCELADOS POR INSOLVENCIA`, `CANCELADOS POR INCOSTEABILIDAD` · **English:** tax debts written off.
- **Basis:** [CFF art. 69][cff-69] fr. V; [art. 146-A][cff-146a]; [SAT technical note][sat-note] rows 4 and 5. Amounts: [LGTAIP][lgtaip] arts. 66 and 67.
- **Meaning:** the tax authority removed a debt from the public accounts. The debt is not extinguished: "la cancelación de los créditos a que se refiere este artículo no libera de su pago".
- **Gets in:** the debt is uncollectable for cost reasons or the debtor is insolvent (see the two values in [`SUPUESTO` values](#supuesto-values)).
- **Gets out:** nothing in art. 146-A reverses a write-off. The file keeps write-offs dated back to 2007. Whether rows are ever removed is not verified.
- **Counterparty:** no direct effect is stated. It records that the SAT gave up collecting a debt; under the insolvency ground this can mean the debtor had no seizable assets or could not be located.
- **In this project:** `sat_69_cancelados.csv`, columns `SUPUESTO`, `FECHA DE CANCELACION`, `MONTO`, `FECHA DE PUBLICACION`; 184,837 rows. Older write-offs: `sat_69_cancelados_art146a_2007_2015.csv`.

### Sentencias

- **In the data:** `SENTENCIAS` · **English:** final criminal convictions for tax offences.
- **Basis:** [CFF art. 69][cff-69] fr. IV ("sentencia condenatoria ejecutoria respecto a la comisión de un delito fiscal").
- **Meaning:** a court convicted the taxpayer of a tax offence and the conviction is final.
- **Gets in:** the conviction becomes enforceable.
- **Gets out:** the statute states no exit other than the clarification procedure.
- **Counterparty:** public bodies may not contract with it for a period equal to the sentence ([art. 32-D][cff-32d] fr. VI).
- **In this project:** `sat_69_sentencias.csv`, column `SUPUESTO`; 610 rows for 572 RFCs (some rows are repeated).

### CSD sin efectos

- **In the data:** `FRACCION X` · **English:** digital seal certificate voided.
- **Basis:** [CFF art. 69][cff-69] fr. X (added DOF 12-11-2021); [art. 17-H][cff-17h] frs. X, XI and XII; [art. 17-H Bis][cff-17hbis]; [RMF rules 2.2.4][rmf-224] and [2.2.15][rmf-2215].
- **Meaning:** the SAT voided the certificate the taxpayer needs to issue invoices.
- **Gets in:** fr. X of art. 69 covers three routes of art. 17-H. Fr. X: the taxpayer's CSD was first restricted temporarily under art. 17-H Bis and it did not cure the problem. Fr. XI: it is on the definitive 69-B list. Fr. XII: it is on the 69-B Bis list. That is the legal scope; which of the three routes the file actually contains is [not resolved](#not-resolved).
- **Gets out:** fr. X of art. 69 itself excepts taxpayers that cure the irregularities or correct their tax situation. Art. 17-H gives a procedure to cure the irregularities and obtain a new certificate, decided within 10 days. It is closed to taxpayers that exhausted the 17-H Bis, 69-B or 69-B Bis procedures without curing them.
- **Counterparty:** the taxpayer cannot issue new invoices with that certificate ([art. 29][cff-29] fr. II requires one). For third parties in good faith, the voiding takes effect from the date and time shown on the SAT site (art. 17-H). The texts read do not void earlier invoices on this ground alone.
- **In this project:** `sat_69_csd_sin_efectos.csv`, columns `SUPUESTO DE CANCELACION CSD`, `FECHA DE CANCELACION CSD`, `ADMINISTRACION GENERAL RESPONSABLE DE LA CANCELACION`; 59,636 rows. Whether `FRACCION X` means fraction X of art. 69 or of art. 17-H is [not resolved](#not-resolved).
- **Note:** certificates voided under art. 17-H fr. XIII (article 49 Bis) are outside fr. X of art. 69, so by law they do not belong on this list.

### Entes públicos y de gobierno omisos

- **In the data:** `FRACCION VII` · **English:** public bodies that omitted tax returns.
- **Basis:** [CFF art. 69][cff-69] fr. VII.
- **Meaning:** an authority or body of any branch or level of government, an autonomous body, political party, trust or fund, or any person or union that receives and spends federal public funds, and that has not filed periodic returns for its own or withheld federal taxes. The SAT also publishes the year and period omitted.
- **Gets in:** a periodic return is overdue.
- **Gets out:** presumably by filing the return and requesting clarification; not verified.
- **Counterparty:** no effect is stated. Each row is one omitted period, not one body.
- **In this project:** `sat_69_entes_publicos_omisos.csv`, columns `SUPUESTO`, `EJERCICIO` (year), `PERIODO` (1 to 12); 3,200 rows for 412 RFCs.

## Other article 69 lists

These seven record a benefit granted or a historical write-off. None describes a current default. Three attributes are the same for all seven:

- **Gets in:** the authority granted the benefit or wrote off the debt (the taxpayer applied for it, except the 2015 decrees, which taxpayers applied themselves).
- **Gets out:** the texts read state nothing that removes the record, other than the clarification procedure of art. 69.
- **Counterparty:** no effect is stated in the texts read.

| List (file) | In the data | English | Basis | What it records |
| --- | --- | --- | --- | --- |
| Reducción de multas (`sat_69_reduccion_multas_art74.csv`) | `ARTICULO 74` | Fine reduction | [CFF art. 74][cff-74]; [RMF 2026 rules 2.14.5 to 2.14.15][rmf-2145]; [SAT note][sat-note] row 1 | The tax authority reduced a fine by up to 100% at the taxpayer's request. Only fines that are final qualify. The SAT note calls it *condonación* and cites rules 2.17.5 to 2.17.16, an older numbering. `FECHA DE AUTORIZACIÓN` runs from 2014 to 2023; `MONTO` is empty in 3,749 of 106,666 rows. |
| Reducción de recargos (`sat_69_reduccion_recargos_art21.csv`) | `CONDONADOS` | Surcharge reduction | [CFF art. 21][cff-21], penultimate paragraph; [SAT note][sat-note] row 3 | Surcharges from a transfer-pricing adjustment between related parties were reduced under an agreement with the tax authority of a treaty country. 4 rows. |
| Condonados de concurso mercantil (`sat_69_condonados_art146b.csv`) | `CONDONADOS` | Debts forgiven in insolvency proceedings | CFF art. 146-B, [repealed DOF 12-11-2021][cff-146a]; [SAT note][sat-note] row 2 | Per the SAT note, partial forgiveness of tax debts for taxpayers in *concurso mercantil*. The repealed text was not read: not verified. 16 rows, 2016 to 2018. |
| Condonados por decreto (`sat_69_condonados_por_decreto.csv`) | `CONDONADOS` | Debts forgiven by decree | Decrees published in the DOF on 22 January and 26 March 2015, per the [SAT page][sat-page] and [SAT note][sat-note] rows 6 and 7; decree texts not verified | VAT and accessories up to 31 December 2014 forgiven for home builders and for sellers of food supplements; the taxpayer applied it itself. 7 rows. |
| Condonados 2007–2015 (`sat_69_condonados_2007_2015.csv`) | Column `Motivo de condonación`, four texts | Debts forgiven, 1 January 2007 to 4 May 2015 | As written in the data: CFF art. 74 with the RMF (4,035 rows); art. 3 transitory of the 2013 federal revenue law (3,901); art. 7 transitory of the 2007 federal revenue law (2,244); decree in the DOF of 5 December 2008 (35). Those texts were not read: not verified | Historical file. It has a year, not a date. |
| Cancelados art. 146-A 2007–2015 (`sat_69_cancelados_art146a_2007_2015.csv`) | Column `MOTIVO`, one text | Debts written off, 1 January 2007 to 4 May 2015 | [CFF art. 146-A][cff-146a] "vigente en el año en que se efectuó la cancelación" | Historical file; same concept as *Cancelados*. 1,146 RFCs are incomplete. |
| Retorno de inversiones (`sat_69_retorno_inversiones.csv`) | `RETORNO INVERSIONES` | Repatriated investments | Per [SAT note][sat-note] row 11: art. Segundo fr. XIII of the transitory provisions of the income tax decree in the DOF of 18 November 2015; decree text not verified | Fines, surcharges and inflation adjustment forgiven for taxpayers that returned investments held abroad up to 31 December 2014. 73 rows, 72 of them individuals. |

## `SUPUESTO` values

`SUPUESTO` means "ground" or "legal hypothesis": the reason the row is published.

| Value | File | Rows | Meaning | Basis |
| --- | --- | --- | --- | --- |
| `FIRMES` | `sat_69_firmes.csv` | 264,209 | See [Firmes](#firmes) | Art. 69 fr. I |
| `EXIGIBLES` | `sat_69_exigibles.csv` | 2,747 | See [Exigibles](#exigibles) | Art. 69 fr. II |
| `NO LOCALIZADOS` | `sat_69_no_localizados.csv` | 53,346 | See [No localizados](#no-localizados) | Art. 69 fr. III |
| `SENTENCIAS` | `sat_69_sentencias.csv` | 610 | See [Sentencias](#sentencias) | Art. 69 fr. IV |
| `CANCELADOS POR INSOLVENCIA` | `sat_69_cancelados.csv` | 70,643 | Written off because the debtor or the jointly liable parties have no seizable assets, cannot be located, or died leaving no assets. Write-off dates 2015 to 2019 | [Art. 146-A][cff-146a], third paragraph; [SAT note][sat-note] row 4 |
| `CANCELADOS POR INCOSTEABILIDAD` | `sat_69_cancelados.csv` | 68,125 | Written off because collecting costs too much: debts up to 200 UDIS; debts up to 20,000 UDIS whose recovery cost exceeds 75% of the debt; or recovery cost equal to or above the debt. Write-off dates 2015 to 2026 | [Art. 146-A][cff-146a], second paragraph; [SAT note][sat-note] row 5 (which mentions only the 200 UDIS case) |
| `CANCELADOS` | `sat_69_cancelados.csv` | 46,069 | Write-off with no stated sub-ground. Write-off dates 2007 to 2016; `MONTO` is 0 or empty in 35,162 rows. The SAT note has no row for it: meaning not verified | [Art. 146-A][cff-146a] presumably; not verified |
| `ARTICULO 74` | `sat_69_reduccion_multas_art74.csv` | 106,666 | Fine reduced | [Art. 74][cff-74] |
| `CONDONADOS` | `sat_69_condonados_art146b.csv` (16), `sat_69_condonados_por_decreto.csv` (7), `sat_69_reduccion_recargos_art21.csv` (4) | 27 | Debt forgiven or surcharge reduced. The same word covers three different legal bases; the file tells which | See [Other article 69 lists](#other-article-69-lists) |
| `RETORNO INVERSIONES` | `sat_69_retorno_inversiones.csv` | 73 | Accessories forgiven on repatriated investments | See above |
| `FRACCION VII` | `sat_69_entes_publicos_omisos.csv` | 3,200 | Fraction VII of art. 69 | Art. 69 fr. VII |
| `FRACCION X` | `sat_69_csd_sin_efectos.csv` (column `SUPUESTO DE CANCELACION CSD`) | 59,636 | CSD voided. Either fraction X of art. 69 (which covers art. 17-H frs. X, XI and XII) or fraction X of art. 17-H alone; the data does not settle it | Art. 69 fr. X; art. 17-H fr. X |

## Article 69-B: invoices for non-existent operations

**Basis:** [CFF art. 69-B][cff-69b]; [RMF 2026 rules 2.9.17, 2.9.18 and 2.9.20][rmf-2915]. Article 69-B is a procedure against the **issuer** of invoices. The five 69-B files list issuers only.

**Trigger (first and last paragraphs):** the authority detects that a taxpayer issued invoices without the assets, staff, infrastructure or material capacity to deliver what they describe, or that the issuer is not located. It also applies to a taxpayer that issues invoices for operations really carried out by another taxpayer whose CSD is restricted or voided.

**Column:** `Situación del contribuyente` in `sat_69b_listado_completo.csv`, which is the sum of the four status files: `sat_69b_presuntos.csv`, `sat_69b_desvirtuados.csv`, `sat_69b_definitivos.csv` and `sat_69b_sentencias_favorables.csv`. An RFC can have more than one row (84 RFCs do), one per procedure.

| Status in the data | English | Basis | Meaning | Gets in | Gets out | Counterparty | Rows |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Presunto` | Presumed | Art. 69-B, paragraphs 1 to 3 | The SAT presumes the operations in the issuer's invoices do not exist. Open procedure | Notified by tax mailbox, on the SAT site and in the DOF | Rebut within 15 days from the last notification (plus 5 on request). The SAT then has 50 days to decide; if it does not notify a decision in time the presumption lapses (paragraph 7) | No legal effect on the invoices yet. A warning to keep evidence that the operations were real | 878 |
| `Desvirtuado` | Rebutted | Art. 69-B, paragraph 6; e.g. [DOF note 5781640][dof-5781640] | The taxpayer disproved the facts. The SAT publishes these quarterly | Evidence accepted by the SAT, or the presumption defeated through a defence (as in note 5781640) | — | The presumption was dropped for the operations covered by that notice. It is not a general clearance | 340 |
| `Definitivo` | Definitive | Art. 69-B, paragraphs 4 and 5; e.g. [DOF note 5792569][dof-5792569] | The taxpayer did not rebut the facts and is "definitivamente" in the situation of paragraph 1. Published in the DOF and on the SAT site, never earlier than 30 days after the decision is notified | No rebuttal, or evidence rejected | The article states no exit other than a ruling that sets the decision aside (next row) | Its invoices produce and produced no tax effect, with general effects. Anyone who gave them tax effect has 30 days from publication to prove the goods or services were real or to file amended returns (paragraph 8; rule 2.9.18). Otherwise the SAT assesses the tax and treats the operations as simulated for criminal purposes (paragraph 9). The issuer's CSD is voided (art. 17-H fr. XI) and public bodies may not contract with it (art. 32-D fr. VII) | 12,128 |
| `Sentencia Favorable` | Favourable ruling | Art. 69-B, paragraph 6; e.g. [DOF note 5792568][dof-5792568] | A final court or administrative ruling set aside the SAT's decision. Published quarterly | The taxpayer filed a defence and won | — | The SAT's finding no longer stands. The ruling does not certify the operations | 1,667 |

In the text in force until 24 July 2018 the definitive list was in the third paragraph of art. 69-B. DOF notices for older procedures still cite it that way ([note 5792570][dof-5792570]).

### Related terms

- **EFOS** — informal acronym for *empresas que facturan operaciones simuladas*: issuers under art. 69-B. The phrase appears in [CFF art. 69-B Ter][cff-69bter]; the acronym appears in neither the CFF nor the RMF 2026. Use it only for `Definitivo` rows. Per the project report, the SAT's CFDI web service returns a field named `ValidacionEFOS`.
- **EDOS** — informal acronym for the **receivers** that deducted those invoices (*empresas que deducen operaciones simuladas*). The acronym was not found in the CFF or the RMF 2026: not verified. The law refers to them in art. 69-B paragraphs 8 and 9 and in art. 69 fr. IX. None of the 22 files lists them.
- **Oficio global** — "global notice": one official letter listing many taxpayers, published on the SAT site and in the DOF, as opposed to the *oficio individual* sent to each taxpayer's tax mailbox ([RMF rule 2.9.17][rmf-2915]). Columns such as `Número y fecha de oficio global de presunción SAT` and `... DOF` hold its number and date. DOF titles call it "listado global de presunción" ([note 5801999][dof-5801999], 171 RFCs).
- **Listado global definitivo** — the definitive list of art. 69-B, fourth paragraph, as titled in the DOF: "listado global definitivo en términos del artículo 69-B, párrafo cuarto" ([note 5792569][dof-5792569]). Rule 2.9.20 uses the same name for the 69-B Bis list.
- **Publicación página SAT / Publicación DOF** — two publication dates per stage. The 15-day rebuttal period runs from the last notification, which is the DOF one (rule 2.9.17). The receivers' 30 days run from publication of the definitive list.

## Article 69-B Bis: improper transfer of tax losses

- **In the data:** `Definitivo` (1 row), `Sentencia Favorable` (2 rows) · **English:** improper transfer of the right to use tax losses.
- **Basis:** [CFF art. 69-B Bis][cff-69bbis]; [RMF 2026 rules 2.9.14 and 2.9.20][rmf-2915].
- **Meaning:** the SAT presumes that a company's tax losses were passed on improperly when the company took part in a restructuring, spin-off, merger or change of shareholders and left its group, and one of six conditions in the article applies (for example, losses larger than its assets in its first three years, mostly from related-party deductions).
- **Gets in:** the taxpayer is notified by tax mailbox only, so there is **no public "Presunto" stage**. It has 20 days (plus 10 on request) to respond; the SAT decides within six months. If the facts are not rebutted, the SAT publishes the list on its site and in the DOF, never earlier than 30 days after notification (ninth paragraph).
- **Gets out:** administrative appeal (*recurso de revocación*) or a court ruling. The data shows `Sentencia Favorable` rows and the DOF carries notices for them ([note 5789648][dof-5789648]), but art. 69-B Bis has no paragraph ordering that publication: basis not verified.
- **Counterparty:** publication confirms the improper transfer and that the losses cannot be deducted. Taxpayers that used those losses have 30 days to correct; after that the SAT may audit them and treat the transfer as a simulated act for criminal purposes. The listed taxpayer's CSD is voided (art. 17-H fr. XII) and public bodies may not contract with it (art. 32-D fr. VII).
- **In this project:** `sat_69b_bis_listado_completo.csv`, `sat_69b_bis_definitivos.csv`, `sat_69b_bis_sentencias_favorables.csv`, column `Situación del contribuyente`; 3 rows in total.

## Article 49 Bis: false invoices (in force since 1 January 2026)

- **In the data:** no CSV. DOF notices titled "Oficio … mediante el cual se comunica el nombre y la clave en el Registro Federal de Contribuyentes a que se refiere la fracción X del artículo 49 Bis" ([note 5793257][dof-5793257]) · **English:** issuers of false invoices.
- **Basis:** [CFF art. 49 Bis][cff-49bis], added by the [decree of 7 November 2025][cff-dec62]; in force 1 January 2026 under its [first transitory article][cff-trans]. Related: [art. 42][cff-42] fr. V g); [art. 29-A][cff-29a] fr. IX; [art. 17-H][cff-17h] fr. XIII; [art. 17-H Bis][cff-17hbis] fr. XIV.
- **Meaning:** a fast on-site inspection to check that a taxpayer's invoices cover operations that exist, are true or are real legal acts. Invoices that do not are "falsos" (art. 29-A fr. IX).
- **Gets in:** the inspection order states why the SAT presumes the invoices are false and suspends invoice issuing at once. The taxpayer has 5 business days to offer evidence; the SAT decides within 15 business days; the whole procedure lasts at most 24 business days. If the presumption is not rebutted (fr. VIII b), or the inspection could not be carried out (fr. III), the invoices are declared false with general effects. Name and RFC are published on the SAT portal and in the DOF within 45 business days.
- **Gets out:** rebutting during the inspection lifts the suspension and avoids publication (fr. VIII a). Only decided cases are published, so there is **no "Presunto" stage**. No exit after publication is stated in the article; the effect of a later court ruling is not verified.
- **Counterparty:** the invoices produce no tax effect. Anyone who received them has 30 calendar days from the DOF publication to reverse their tax effect with an amended return. Otherwise the SAT restricts the receiver's own CSD (art. 17-H Bis fr. XIV). The issuer's CSD is voided (art. 17-H fr. XIII).
- **In this project:** DOF API only. The location of these names on the SAT portal was not found.

## Supporting terms

| Term | English | Basis | Meaning | In this project |
| --- | --- | --- | --- | --- |
| RFC (Registro Federal de Contribuyentes) | Federal taxpayer registry, and the key it assigns | [CFF art. 27][cff-27] | The tax identifier of a person or entity | Column `RFC` in all 22 files. In *Firmes* and *No localizados* every `M` row has 12 characters and every `F` row 13; the rule that fixes those lengths is not verified |
| Persona física / persona moral | Individual / legal entity | [Código Civil Federal][ccf] arts. 22 and 25; the CFF uses both terms without defining them | A human being, or an entity such as a company, association, union or public body | `TIPO PERSONA`: `F` or `M`; spelled out in the 2007–2015 files. The 69-B files have no such column |
| Crédito fiscal | Tax debt | [CFF art. 4][cff-4] | An amount the State is entitled to collect from taxes, their accessories or other public charges | The object of *Firmes*, *Exigibles*, *Cancelados* and *Condonados* |
| CSD (Certificado de Sello Digital) | Digital seal certificate | [CFF art. 29][cff-29] fr. II; [arts. 17-H][cff-17h] and [17-H Bis][cff-17hbis] | The certificate that proves authorship of invoices. It can be restricted temporarily (17-H Bis) and then voided (17-H) | `sat_69_csd_sin_efectos.csv` |
| CFDI (Comprobante Fiscal Digital por Internet) | Electronic tax invoice | [CFF arts. 29][cff-29] and [29-A][cff-29a] | The digital invoice issued through the SAT. The "comprobantes" of arts. 69-B and 49 Bis | Planned CFDI check tool |
| DOF (Diario Oficial de la Federación) | Official federal gazette | Arts. 69-B, 69-B Bis and 49 Bis require publication in it | Publication there starts the deadlines for third parties | DOF API; columns `Publicación DOF …` |
| RMF (Resolución Miscelánea Fiscal) | Annual tax rules | Issued by the SAT under CFF art. 33 fr. I g) (stated in the [RMF 2026][rmf] preamble) | General rules that detail the CFF. Rule numbers change between years | Rules cited here are from the 2026 edition |
| Fecha de primera publicación | Date of first publication | No definition found: not verified | Read from the header: the date the taxpayer first appeared on that list. It does not show later changes | `FECHA DE PRIMERA PUBLICACION` / `FECHAS DE PRIMERA PUBLICACION`; earliest value 01/01/2014 |
| Estrados | Notification by public posting | [CFF art. 134][cff-134] fr. III; [art. 139][cff-139] | Used when the person cannot be found, disappears or resists notification. The document is posted for 10 days on the authority's website and counts as notified on the 11th day | Appears in DOF notice annexes ("Fecha de fijación en los estrados"). No data source verified |
| Buzón tributario | Tax mailbox | [CFF art. 134][cff-134] fr. I | The taxpayer's electronic mailbox with the SAT, where individual notices are served | Not public |
| Aclaración | Clarification request | [CFF art. 69][cff-69], last paragraph; [RMF rule 2.9.15][rmf-2915] | The way to contest a publication under art. 69. Decided in 3 days; the SAT also refreshes the published data quarterly | Explains why art. 69 files change four times a year |
| Opinión del cumplimiento | Compliance opinion | [CFF art. 32-D][cff-32d]; [RMF rule 2.1.36][rmf-2136] | The SAT's statement that a taxpayer is up to date. Among other things it requires no firm or enforceable debts, being located, and not being on the definitive 69-B list or subject to a 49 Bis decision | Out of scope: needs the taxpayer's credentials |
| AGR, AGAFF, AGGC, AGACE, AGH | SAT general administrations | [RMF 2026 glossary][rmf-glos] | Administración General de Recaudación (collection), de Auditoría Fiscal Federal (federal tax audit), de Grandes Contribuyentes (large taxpayers), de Auditoría de Comercio Exterior (foreign trade audit), de Hidrocarburos (hydrocarbons). The SAT unit that issued the act | `ADMINISTRACION GENERAL RESPONSABLE DE LA CANCELACION`: `AGR` 59,564 · `AGACE` 50 · `AGH` 21 · `AGGC` 1 |

## Clarifications for the other project documents

- DOF note 5801999 is specifically a **presumption** notice ("listado global de presunción"); a definitive-list example is note 5792569.
- Article 146-B of the CFF was **repealed** in 2021. The *Condonados de concurso mercantil* file is historical.
- On 13 November 2026 the SAT page shows article 69 data "actualizada al 1 de octubre de 2026". The snapshot in this repository holds the 1 July 2026 batch.

## Not resolved

1. **Definition of "firme".** Not found in the CFF or the RMF 2026.
2. **Criteria for "no localizado"** and for "incumplimiento sistemático" in rule 2.9.16.
3. **`FRACCION X` in the CSD file:** fraction X of art. 69 or of art. 17-H. All 59,636 rows carry it. The evidence points both ways. The sibling file uses `FRACCION VII` for a fraction of art. 69. But the column is named "supuesto de cancelación CSD"; AGAFF, which runs art. 69-B, is not among the responsible administrations; 124 RFCs that are only `Presunto` carry the value; and none of the three 69-B Bis RFCs is in the file. The 432 `Definitivo` RFCs in the file settle nothing, because their CSD may have been voided earlier through art. 17-H Bis.
4. **Plain `CANCELADOS`** (46,069 rows): the SAT note does not describe it. Also not verified: whether rows of the *Cancelados* files are ever removed.
5. **Fraction behind the fine-reduction and repatriation files:** fr. VI by the SAT note's wording, but the files do not say.
6. **Texts not read:** the repealed art. 146-B; the decrees of 5 December 2008, 22 January 2015 and 26 March 2015; the transitory articles of the 2007 and 2013 federal revenue laws; the income tax decree of 18 November 2015.
7. **Exit requirements per list:** procedure 85/CFF in Annex 2 of the RMF was not read, including whether paying a firm debt removes the entry.
8. **Publication of favourable rulings under art. 69-B Bis:** no paragraph of the article orders it. Likewise, the effect of a court ruling after a publication under art. 49 Bis.
9. **A lapsed 69-B presumption** (no decision in 50 days): how the data shows it, if at all.
10. **`PERIODO`** in the public-bodies file: values 1 to 12, presumably the month.
11. **Later amendments:** RMF 2026 was read as first published; its amending resolutions were not checked.
12. **Article 69 frs. VIII and IX and article 49 Bis on the SAT portal:** no file among the 22; whether the SAT publishes them elsewhere was not checked.
13. **RFC length rule** (12 or 13 characters), **"fecha de primera publicación"** and the acronym **EDOS**: no primary source.

## Sources

- Cámara de Diputados — [CFF, current text][cff] (última reforma DOF 09-04-2026); [list of CFF reforms](https://www.diputados.gob.mx/LeyesBiblio/ref/cff.htm); [decree of 7 November 2025][cff-dec62]; [LGTAIP][lgtaip] (new law, DOF 20-03-2025); [Código Civil Federal][ccf].
- SAT — [Datos abiertos, contribuyentes publicados][sat-page]; [technical note `causasymotivos.xls`][sat-note]; [RMF 2026][rmf] (DOF 28-12-2025).
- DOF (SIDOF API) — notes [5793257][dof-5793257] (49 Bis), [5801999][dof-5801999] (69-B presumption), [5792569][dof-5792569] (69-B definitive), [5792568][dof-5792568] (69-B favourable rulings), [5781640][dof-5781640] (69-B rebutted), [5789648][dof-5789648] (69-B Bis favourable ruling).

[cff]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf
[cff-4]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=2
[cff-10]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=6
[cff-17h]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=21
[cff-17hbis]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=22
[cff-21]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=33
[cff-27]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=47
[cff-29]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=55
[cff-29a]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=57
[cff-32d]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=74
[cff-42]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=91
[cff-49bis]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=107
[cff-65]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=127
[cff-69]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=133
[cff-69b]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=135
[cff-69bbis]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=137
[cff-69bter]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=139
[cff-74]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=143
[cff-134]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=203
[cff-139]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=205
[cff-145]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=210
[cff-146a]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=214
[cff-trans]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf#page=373
[cff-dec62]: https://www.diputados.gob.mx/LeyesBiblio/ref/cff/CFF_ref62_07nov25.pdf
[lgtaip]: https://www.diputados.gob.mx/LeyesBiblio/pdf/LGTAIP.pdf#page=21
[ccf]: https://www.diputados.gob.mx/LeyesBiblio/pdf/CCF.pdf#page=4
[rmf]: https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/rmf/RMF_2026-DOF-28122025.pdf
[rmf-glos]: https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/rmf/RMF_2026-DOF-28122025.pdf#page=5
[rmf-211]: https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/rmf/RMF_2026-DOF-28122025.pdf#page=11
[rmf-2136]: https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/rmf/RMF_2026-DOF-28122025.pdf#page=46
[rmf-232]: https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/rmf/RMF_2026-DOF-28122025.pdf#page=67
[rmf-2311]: https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/rmf/RMF_2026-DOF-28122025.pdf#page=72
[rmf-224]: https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/rmf/RMF_2026-DOF-28122025.pdf#page=58
[rmf-2215]: https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/rmf/RMF_2026-DOF-28122025.pdf#page=63
[rmf-2915]: https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/rmf/RMF_2026-DOF-28122025.pdf#page=201
[rmf-2145]: https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/rmf/RMF_2026-DOF-28122025.pdf#page=245
[sat-page]: https://www.sat.gob.mx/minisitio/DatosAbiertos/contribuyentes_publicados.html
[sat-note]: https://wu1agsprosta001.blob.core.windows.net/agsc-publicaciones/Datos_abiertos/Cifras_SAT/Indef/causasymotivos.xls
[dof-5793257]: https://sidof.segob.gob.mx/dof/sidof/notas/nota/5793257
[dof-5801999]: https://sidof.segob.gob.mx/dof/sidof/notas/nota/5801999
[dof-5792569]: https://sidof.segob.gob.mx/dof/sidof/notas/nota/5792569
[dof-5792568]: https://sidof.segob.gob.mx/dof/sidof/notas/nota/5792568
[dof-5792570]: https://sidof.segob.gob.mx/dof/sidof/notas/nota/5792570
[dof-5781640]: https://sidof.segob.gob.mx/dof/sidof/notas/nota/5781640
[dof-5789648]: https://sidof.segob.gob.mx/dof/sidof/notas/nota/5789648
