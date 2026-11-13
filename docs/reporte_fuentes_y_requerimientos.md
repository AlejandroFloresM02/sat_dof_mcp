# MCP SAT/DOF — Reporte de fuentes y requerimientos técnicos

Oct 25, 2026 · @Alejandro Flores Madriz

## Resumen

El MCP es viable con fuentes gratuitas: el SAT publica 22 listas en CSV en su portal de Datos Abiertos y el DOF tiene una API JSON sin autenticación documentada que probé con éxito. La restricción principal no es de datos sino de red: un conector de Claude Enterprise se conecta desde la nube de Anthropic, así que un servidor 100% privado dentro de la oficina no funciona como conector de organización.

- **Verificado en esta sesión:** la página de Datos Abiertos del SAT y sus fechas de actualización; que las URLs de los CSV responden; la API del DOF (3 consultas reales en producción); el WSDL del servicio SOAP de consulta de CFDI; los requisitos de conectores personalizados de Claude y las IPs de Anthropic.
- **No pude verificar:** la consulta de notificaciones por estrados y si el SAT publica el artículo 49 Bis en su portal. Están detallados en *Huecos*.
- **Decisión que bloquea el diseño:** si la oficina puede exponer un endpoint HTTPS aceptando tráfico solo del rango de Anthropic `160.79.104.0/21`. Si no, hay que hospedar fuera de la oficina o usar MCP local en Claude Desktop.

## Fuentes del SAT

Todas las listas oficiales relevantes están en una sola página: [Datos abiertos SAT · Contribuyentes publicados](https://www.sat.gob.mx/minisitio/DatosAbiertos/contribuyentes_publicados.html). Los archivos se sirven desde `https://wu1agsprosta001.blob.core.windows.net/agsc-publicaciones/Datos_abiertos/`; abajo solo la ruta después de ese prefijo.

**Estado de verificación:** la página y las fechas fueron leídas directamente. Actualización: el 25 de octubre descargué los 22 archivos completos desde Chrome; ver la sección Datos extraídos del SAT. Antes había probado 4 URLs, que respondían servidas como `application/vnd.ms-excel`, pero mi herramienta las recibió como binario y no pude leer columnas ni codificación. Las 22 URLs funcionan; la columna Probado de estas tablas refleja la prueba inicial.

### Artículo 69-B (EFOS) · actualizado al 30 de septiembre de 2026

| Archivo | Ruta | Probado |
| --- | --- | --- |
| Listado completo | `Documents_AGAFF/Listado_completo_69-B.csv` | Responde |
| Definitivos | `Documents_AGAFF/Definitivos.csv` | No |
| Desvirtuados | `Documents_AGAFF/Desvirtuados.csv` | No |
| Presuntos | `Documents_AGAFF/Presuntos.csv` | Responde |
| Sentencias favorables | `Documents_AGAFF/SentenciasFavorables.csv` | No |

### Artículo 69-B Bis (transmisión indebida de pérdidas) · actualizado al 9 de octubre de 2026

| Archivo | Ruta | Probado |
| --- | --- | --- |
| Listado completo | `Documents_AGGC/Listado_69_B_Bis_Completo.csv` | Responde |
| Definitivos | `Documents_AGGC/Listado_69_B_Bis_Definitivo.csv` | No |
| Sentencias favorables | `Documents_AGGC/Listado_69_B_Bis_SentenciaFa.csv` | No |

### Artículo 69 (incumplidos) · actualizado al 1 de julio de 2026

| Archivo | Ruta | Probado |
| --- | --- | --- |
| No localizados | `Documents_AGR/No_localizados.csv` | Responde |
| Exigibles | `Documents_AGR/Exigibles.csv` | No |
| Firmes | `Documents_AGR/Firmes.csv` | No |
| Cancelados | `Documents_AGR/Cancelados.csv` | No |
| Sentencias | `Documents_AGR/Sentencias.csv` | No |
| CSD sin efectos | `Documents_AGR/CSDsinefectos.csv` | No |
| Entes públicos y de gobierno omisos | `Documents_AGR/EntespublicosydeGobiernoomisos.csv` | No |
| Reducción de multas (art. 74) | `Documents_AGR/ReduccionArt74CFF.csv` | No |
| Condonados concurso mercantil (art. 146B) | `Cifras_SAT/Indef/Condonadosart146BCFF.csv` | No |
| Reducción de recargos (art. 21) | `Cifras_SAT/Indef/Condonadosart21CFF.csv` | No |
| Condonados por decreto 2015 | `Cifras_SAT/Indef/CondonadosporDecreto.csv` | No |
| Condonados 2007–2015 | `Cifras_SAT/Indef/Condonados_07_15.csv` | No |
| Cancelados art. 146A 2007–2015 | `Cifras_SAT/Indef/Cancelados_07_15.csv` | No |
| Retorno de inversiones | `Cifras_SAT/Indef/Retornoinversiones.csv` | No |

La misma sección incluye un documento técnico (`Cifras_SAT/Indef/causasymotivos.xls`) y una estadística de incumplidos (`AGR/03_02_26/FORMATO_32_ContribIncumplidos.xls`); no son listas de RFC.

### Servicio de consulta de CFDI (SOAP)

Verifica un CFDI concreto contra el SAT y, desde finales de 2020, regresa el campo `ValidacionEFOS`. Leí el WSDL y es válido: servicio `ConsultaCFDIService`, operación `Consulta`, SOAPAction `http://tempuri.org/IConsultaCFDIService/Consulta`, endpoint `https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc`. Recibe la expresión `?re=<RFC emisor>&rr=<RFC receptor>&tt=<total>&id=<UUID>` y responde `CodigoEstatus`, `Estado`, `EsCancelable`, `EstatusCancelacion` y `ValidacionEFOS` ([documentación SAT](https://www.sat.gob.mx/minisitio/Factura/documentos/cancelacion/consulta_cfdi.pdf), [phpcfdi/sat-estado-cfdi](https://github.com/phpcfdi/sat-estado-cfdi)). No hice una consulta real porque requiere un CFDI existente.

## Datos extraídos del SAT (verificado el 25 de octubre de 2026)

Descargué los 22 archivos completos (79.7 MB, 738,602 registros) desde tu Chrome y los convertí a CSV UTF-8 sin perder ningún registro. No son archivos de Excel: son CSV de texto en codificación Windows-1252, y el servidor solo los etiqueta como `application/vnd.ms-excel`. Por eso la conversión necesaria fue de codificación y limpieza, no de formato.

### Cómo verifiqué que la conversión está completa

- **Estructura:** en los 22 archivos, cada fila tiene el mismo número de campos que su encabezado y ninguna comilla quedó abierta. El parser respeta comillas y saltos de línea dentro de un campo (hay razones sociales partidas en dos líneas).
- **Ida y vuelta:** volví a leer cada CSV UTF-8 generado y lo comparé campo por campo con el original. Hubo 0 diferencias en las 738,602 filas.
- **Cuadre interno del 69-B:** el listado completo (15,013) es exactamente la suma de Definitivos (12,128), Sentencias favorables (1,667), Presuntos (878) y Desvirtuados (340). La columna *Situación del contribuyente* del completo da esos mismos 4 conteos.
- **Columnas descartadas:** los 4 sub-listados del 69-B traen 4 o 5 columnas sin nombre al final. Las revisé y están vacías en todas las filas.
- **Codificación corregida:** en los 2 archivos históricos 2007–2015, 147 caracteres venían en otra codificación (CP850) dentro del mismo archivo. Por ejemplo, `COMPA¥IA` era `COMPAÑIA`, y `MÉXICO` traía un carácter de control en lugar de la É. Corregí 4 caracteres (`¥`→Ñ, `¤`→ñ, `µ`→Á, byte 0x90→É) después de revisar ejemplos de cada uno.
- **Errores de origen que dejé intactos:** 3 nombres vienen mal desde el SAT (`CARRE±O`, `ZU¥IGA`, `INGENIERÃ­A`), uno en *Firmes*, uno en *Cancelados* y uno en *CSD sin efectos*. Los dejé como están.

**Pendiente:** los archivos convertidos existen en la memoria de tu navegador, pero aún no están guardados en disco. El acceso a una carpeta de tu Mac fue rechazado, y descargarlos a tu carpeta de Descargas requiere tu permiso.

### Estructura real de los archivos

Los archivos del 69-B y del 69-B Bis traen 2 filas de preámbulo antes del encabezado: un aviso con la fecha de corte y el título. Los del artículo 69 empiezan directo en el encabezado.

| Archivo | Columnas | Registros | RFC distintos | Fechas de publicación en los datos |
| --- | --- | --- | --- | --- |
| 69-B Listado completo | 20 | 15,013 | 14,831 | 10/01/2014 a 09/10/2026 |
| 69-B Definitivos | 20 | 12,128 | 12,041 | 10/01/2014 a 09/10/2026 |
| 69-B Sentencias favorables | 20 | 1,667 | 1,646 | 10/01/2014 a 07/08/2026 |
| 69-B Presuntos | 20 | 878 | 864 | 10/01/2014 a 09/10/2026 |
| 69-B Desvirtuados | 20 | 340 | 340 | 10/01/2014 a 06/03/2026 |
| 69-B Bis Listado completo | 12 | 3 | 3 | 25/01/2024 a 09/10/2026 |
| 69-B Bis Sentencias favorables | 12 | 2 | 2 | (incluido en el completo) |
| 69-B Bis Definitivos | 12 | 1 | 1 | (incluido en el completo) |
| 69 Firmes | 6 | 264,209 | 264,209 | 01/01/2014 a 01/07/2026 |
| 69 Cancelados | 8 | 184,837 | 182,297 | 01/02/2014 a 01/07/2026 |
| 69 Reducción de multas (art. 74) | 8 | 106,666 | 68,400 | 16/02/2014 a 19/01/2024 |
| 69 CSD sin efectos | 6 | 59,636 | 58,939 | 23/07/2024 a 01/07/2026 |
| 69 No localizados | 6 | 53,346 | 53,346 | 01/01/2014 a 01/07/2026 |
| 69 Cancelados art. 146A 2007–2015 | 7 | 23,004 | 21,707 | Columna Año: 2007 a 2015 |
| 69 Condonados 2007–2015 | 7 | 10,215 | 8,083 | Columna Año: 2007 a 2015 |
| 69 Entes públicos omisos | 6 | 3,200 | 412 | 23/07/2024 a 01/07/2026 |
| 69 Exigibles | 6 | 2,747 | 2,747 | 01/01/2014 a 01/07/2026 |
| 69 Sentencias | 6 | 610 | 572 | 01/01/2014 a 01/04/2026 |
| 69 Retorno de inversiones | 8 | 73 | 73 | 01/05/2016 a 18/10/2016 |
| 69 Condonados concurso mercantil (146B) | 8 | 16 | 16 | 16/01/2016 a 16/09/2018 |
| 69 Condonados por decreto | 8 | 7 | 7 | 16/03/2014 a 16/07/2016 |
| 69 Reducción de recargos (art. 21) | 8 | 4 | 4 | 01/03/2016 a 01/07/2020 |

En total hay 611,724 RFC distintos entre las 22 listas.

**Encabezados reales:**

- **69-B (20 columnas):** `No`, `RFC`, `Nombre del Contribuyente`, `Situación del contribuyente`, y para cada etapa (presunción, desvirtuados, definitivos, sentencia favorable) 4 columnas: número y fecha del oficio global en el SAT, fecha de publicación en la página del SAT, número y fecha del oficio global en el DOF, y fecha de publicación en el DOF.
- **69-B Bis (12 columnas):** misma idea, con 2 etapas (definitivo y sentencia favorable).
- **No localizados, Exigibles, Firmes:** `RFC`, `RAZON SOCIAL`, `TIPO PERSONA`, `SUPUESTO`, `FECHA DE PRIMERA PUBLICACION`, `ENTIDAD FEDERATIVA`.
- **Sentencias:** las mismas 6, con `RAZÓN SOCIAL` y `FECHAS DE PRIMERA PUBLICACION`.
- **Cancelados:** `RFC`, `RAZON SOCIAL`, `TIPO PERSONA`, `SUPUESTO`, `FECHA DE CANCELACION`, `MONTO`, `FECHA DE PUBLICACION`, `ENTIDAD FEDERATIVA`.
- **Reducción de multas (art. 74):** igual que Cancelados, con `FECHA DE AUTORIZACIÓN` en lugar de fecha de cancelación y el nombre como `NOMBRE, DENOMINACIÓN O RAZÓN SOCIAL`.
- **CSD sin efectos:** `RFC`, `NOMBRE O RAZON SOCIAL`, `SUPUESTO DE CANCELACION CSD`, `FECHA DE CANCELACION CSD`, `ADMINISTRACION GENERAL RESPONSABLE DE LA CANCELACION`, `FECHA DE PUBLICACION`.
- **Entes públicos omisos:** `RFC`, `RAZON SOCIAL`, `SUPUESTO`, `EJERCICIO`, `PERIODO`, `FECHA DE PRIMERA PUBLICACION`.
- **Condonados 146B, por decreto, recargos art. 21 y Retorno de inversiones:** `RFC`, `RAZÓN SOCIAL`, `TIPO PERSONA`, `SUPUESTO`, `FECHAS DE PRIMERA PUBLICACION`, `MONTO`, una fecha de publicación "con monto de acuerdo a la Ley de Transparencia" y `ENTIDAD FEDERATIVA`.
- **Históricos 2007–2015:** `Año`, `Tipo de persona`, `RFC`, `Contribuyente`, `Importe condonado` (o `IMPORTE`), `Motivo de condonación` (o `MOTIVO`), `Entidad Federativa`.

### Valores categóricos encontrados

| Campo | Valores reales |
| --- | --- |
| Situación (69-B) | Definitivo 12,128 · Sentencia Favorable 1,667 · Presunto 878 · Desvirtuado 340 |
| Situación (69-B Bis) | Sentencia Favorable 2 · Definitivo 1 |
| SUPUESTO en Cancelados | Cancelados por insolvencia 70,643 · Cancelados por incosteabilidad 68,125 · Cancelados 46,069 |
| SUPUESTO en el resto del art. 69 | Un solo valor por archivo (por ejemplo `FIRMES`, `NO LOCALIZADOS`, `FRACCION X` en CSD, `FRACCION VII` en entes omisos) |
| TIPO PERSONA | `F` o `M` |
| ENTIDAD FEDERATIVA | 32 valores en No localizados y en Cancelados |

### Muestra de registros (personas morales)

**69-B:**

| RFC | Nombre | Situación | Oficio de presunción | Pub. DOF presunción | Oficio de definitivo | Pub. DOF definitivo |
| --- | --- | --- | --- | --- | --- | --- |
| AAA120730823 | ASESORES Y ADMINISTRADORES AGRICOLAS, S. DE R.L. DE C.V. | Definitivo | 500-05-2016-38728 de fecha 16 de diciembre de 2016 | 19/01/2017 | 500-05-2018-14172 de fecha 25 de mayo de 2018 | 28/06/2018 |
| AAP200401PB5 | APEC AGENCIA PUBLICITARIA EMPRESARIAL Y CORPORATIVA, S.A. DE C.V. | Presunto | 500-05-00-00-00-2026-21664 de fecha 10 de julio de 2026 | 18/09/2026 |  |  |

**69-B Bis:**

| RFC | Nombre | Situación | Oficio definitivo | Pub. página SAT definitivo | Pub. DOF definitivo |
| --- | --- | --- | --- | --- | --- |
| OAN151230HWA | OPERADORA AUTOPISTAS NACIONALES EQUIVENT, S.A. DE C.V. | Sentencia Favorable | 900-04-00-00-00-2024-80 de 25 de enero de 2024 | 25/01/2024 | 05/07/2024 |

Ese mismo registro trae también la etapa de sentencia favorable: oficio 900 04 00 00 00 2026-254 del 12 de marzo de 2026, publicado en el DOF el 05/06/2026.

**Artículo 69:**

| Archivo | RFC | Razón social | Supuesto | Fechas | Otros campos |
| --- | --- | --- | --- | --- | --- |
| No localizados | DMC990622AG8 | 2 M CONSTRUCTORA SA DE CV | NO LOCALIZADOS | Primera publicación 01/01/2014 | CIUDAD DE MEXICO |
| Cancelados | &HI0102165P2 | A & H INCENTIVE GROUP SA DE CV | CANCELADOS POR INSOLVENCIA | Cancelación 28/05/2019 · publicación 20/08/2019 | Monto 1,390,273 · BAJA CALIFORNIA SUR |
| CSD sin efectos | GTM870825HA7 | GRUPO TMM S A B | FRACCION X | Cancelación CSD 05/01/2024 · publicación 23/07/2024 | AGGC |
| Entes omisos | MZA850101LF7 | MUNICIPIO DE ZACUALPAN SIN TIPO DE SOCIEDAD | FRACCION VII | Primera publicación 23/07/2024 | Ejercicio 2021 · periodo 9 |

### Problemas de calidad que el parser debe manejar

| Problema | Dónde | Cuántos | Cómo tratarlo |
| --- | --- | --- | --- |
| RFC suprimido por orden judicial (`XXXXXXXXXXXX`); el nombre trae el texto de la resolución | 69-B | 91 filas (73 definitivos, 15 presuntos, 3 sentencias favorables) | No se pueden buscar por RFC ni por nombre. Excluir de búsquedas y contarlos aparte |
| El mismo RFC aparece en más de una fila con distinta situación (otro procedimiento) | 69-B | 84 RFC | `buscar_rfc` debe regresar todas las filas, no una |
| Fechas que no son `DD/MM/AAAA`: número de serie de Excel (`44014`) o rangos (`25/05/2022 - 26/04/2021`) | Columnas de publicación del 69-B | 196 celdas | Convertir el serial; guardar el rango como texto y sus 2 fechas |
| RFC con minúsculas (`BSi1905214W5`) | Reducción de multas | 22 | Pasar a mayúsculas |
| RFC incompletos (3 a 10 caracteres) | Cancelados art. 146A 2007–2015 | 1,146 | Buscar solo por nombre en ese archivo |
| RFC genérico mal escrito (`XAXX01101000`) | Firmes | 2 | Ignorar |
| Fecha de corte del encabezado anterior a los datos | 69-B dice "30 de septiembre", pero trae publicaciones DOF hasta el 9 de octubre | Todo el archivo | Reportar la fecha de corte Y la última fecha encontrada en los datos |

La fecha del artículo 69 sí cuadra: la página dice 1 de julio de 2026 y la última publicación en los datos es esa misma fecha, aunque los archivos tienen fecha de modificación del 19 al 22 de octubre.

## Análisis por intent: qué datos soportan cada herramienta

Los 22 CSV alcanzan para 7 intents. Para cada uno anoto solo campos que existen en los archivos y límites que medí. Otros 3 intents necesitan fuentes distintas a los CSV.

| Intent (tool) | Pregunta típica | Datos reales que la soportan | Límites medidos |
| --- | --- | --- | --- |
| `buscar_rfc` | ¿Este RFC está en alguna lista del SAT? | Columna `RFC` en las 22 listas: 611,724 RFC distintos. Por coincidencia regresa archivo, situación o supuesto, fechas y oficios | 91 filas del 69-B tienen RFC suprimido y no se pueden encontrar. 1,146 RFC incompletos en el histórico 146A tampoco |
| `detalle_69b` | ¿En qué etapa va y cuándo se publicó? | 16 columnas del 69-B: número y fecha de oficio, y fecha de publicación en el SAT y en el DOF, para presunción, desvirtuado, definitivo y sentencia favorable. Lo mismo para el 69-B Bis con 2 etapas | 84 RFC tienen más de una fila (más de un procedimiento): se regresan todas. 196 fechas vienen como serial de Excel o como rango |
| `buscar_nombre` | ¿La empresa X aparece? | Columna de nombre en los 22 archivos, con 7 encabezados distintos: `Nombre del Contribuyente`, `RAZON SOCIAL`, `RAZÓN SOCIAL`, `NOMBRE O RAZON SOCIAL`, `NOMBRE, DENOMINACIÓN O RAZÓN SOCIAL`, `Contribuyente` y `CONTRIBUYENTE` | Hay razones sociales partidas en 2 líneas, 91 nombres reemplazados por el texto de una resolución judicial y 3 nombres con caracteres dañados desde el SAT. Requiere normalizar acentos y puntuación (`S.A. DE C.V.` contra `SA DE CV`) |
| `revisar_proveedores` | Revisa esta lista de proveedores | Lo mismo que `buscar_rfc`, en lote y consolidado por RFC | Un RFC puede estar en varias listas: 1,599 RFC del 69-B también están en No localizados, 2,407 en Firmes, 1,649 en Cancelados y 633 en CSD sin efectos |
| `novedades` | ¿Qué se publicó desde el día X? | Fechas de publicación en página del SAT y en el DOF por etapa (69-B, hasta el 09/10/2026); fecha de primera publicación o de publicación en el art. 69 (hasta el 01/07/2026) | El art. 69 solo trae la primera publicación. Para saber qué entró o salió entre dos fechas hay que comparar contra la descarga anterior: los archivos no traen historial. Los históricos 2007–2015 solo tienen año |
| `montos_y_creditos` | ¿Tiene créditos cancelados o condonados, y de cuánto? | `MONTO` en Cancelados, Reducción de multas, Condonados 146B, por decreto, recargos y Retorno de inversiones; `Importe` en los históricos; `FECHA DE CANCELACION` o `FECHA DE AUTORIZACIÓN` | El monto viene como texto con comas (`1,390,273`); no hay columna de moneda |
| `estadisticas` | ¿Cuántos EFOS definitivos hay por estado? | `Situación` (4 valores), `SUPUESTO`, `TIPO PERSONA` (F/M), `ENTIDAD FEDERATIVA` (32 valores) | El 69-B no tiene columnas de tipo de persona ni de entidad federativa; CSD sin efectos y entes omisos tampoco tienen entidad |
| `estado_fuentes` | ¿Qué tan actualizados están los datos? | Aviso de fecha de corte en la primera fila del 69-B y del 69-B Bis; fecha de la página para el art. 69; encabezado `Last-Modified` de cada archivo; última fecha encontrada en los datos | El aviso del 69-B dice 30 de septiembre, pero los datos llegan al 9 de octubre: hay que mostrar ambas fechas |

**Intents que no salen de los CSV:**

- `buscar_49bis`: solo existe en el DOF (verificado: 3 oficios del 10 de julio de 2026).
- `verificar_cfdi`: servicio SOAP del SAT, en vivo.
- Estrados: sigue sin fuente verificada.

**Lo que los archivos NO traen, así que ninguna herramienta debe prometerlo:** domicilio, actividad económica, representante legal, motivo detallado del 69-B, ni el tipo de persona en el 69-B. El tipo de persona podría derivarse de la longitud del RFC (12 caracteres moral, 13 física), pero sería una regla nuestra, no un dato del SAT.

**Recomendación de diseño a partir de los datos:** unificar las 22 listas en una tabla con `rfc`, `nombre`, `lista`, `situacion_o_supuesto`, `fechas` y `detalle` (JSON con las columnas propias de cada archivo), más una tabla aparte para las etapas del 69-B. Así `buscar_rfc`, `buscar_nombre` y `revisar_proveedores` consultan un solo índice.

## Fuentes del DOF

El DOF expone una API REST de solo lectura (GET, JSON) que funciona en producción: la probé con 3 llamadas reales y todas respondieron `messageCode: 200`. Es la única vía verificada para el artículo 49 Bis, que no tiene CSV en Datos Abiertos del SAT.

La documentación oficial ([SIDOF · Datos abiertos](https://sidof.segob.gob.mx/datos_abiertos)) apunta al host de pruebas `sidofqa.segob.gob.mx`. Comprobé que `sidof.segob.gob.mx` responde igual en las rutas de notas que probé. Los documentos no mencionan token, registro ni límites de uso.

| Servicio | Endpoint (GET, prefijo `https://sidof.segob.gob.mx/dof/sidof`) | Parámetros | Probado |
| --- | --- | --- | --- |
| Notas por fecha | `/notas/{fecha}` | `DD-MM-AAAA` | Sí |
| Nota por código | `/notas/nota/{codNota}` | 7 dígitos | Sí |
| Notas por diario | `/notas/obtenerNotasPorDiario/{codDiario}` | 6 dígitos | No |
| Diarios por fecha | `/diarios/porFecha/{fecha}` | `DD-MM-AAAA` | No |
| Diarios por año | `/diarios/{año}` | 4 dígitos | No |
| Diario por fecha y edición | `/diarios/obtieneDiario/{fecha}/{edicion}` | `MAT`, `VES` o `EXT` | No |
| Documento Word de una nota | `/documentos/doc/{codNota}` | 7 dígitos | No |
| PDF de la edición | `/documentos/pdf/{codDiario}` | 6 dígitos | No |
| Indicadores | Documentado aparte ([PDF](https://sidof.segob.gob.mx/datos_abiertos/getPDF/61)) | No lo leí | No |

**Pruebas realizadas:**

- `/notas/10-07-2026` regresó 88 notas, entre ellas los 3 oficios del artículo 49 Bis (códigos 5793257, 5793258, 5793259).
- `/notas/03-07-2026` regresó 82 notas, entre ellas 2 "listado global definitivo en términos del artículo 69-B" y 2 listados de contribuyentes que promovieron medios de defensa.
- `/notas/nota/5793257` regresó el oficio completo. El texto viene como HTML en el campo `cadenaContenido`, y de ahí habría que extraer el RFC y la razón social.

**Detalles de formato a considerar:** los campos vacíos llegan como el texto `"null"`, no como JSON null; `tamanioContenido` vale 0 aunque haya contenido; algunas notas no tienen `titulo`. Las ediciones son matutina, vespertina y extraordinaria, y según la documentación normalmente no hay publicación en fines de semana ni días festivos. La página de estado de la API (`/apiStatus`) devolvió error cuando la consulté.

## Huecos: lo que no pude verificar o no sé

Cinco puntos siguen abiertos; ninguno bloquea empezar. El primero de la tabla ya está resuelto.

| Tema | Qué pasó | Qué falta |
| --- | --- | --- |
| Columnas y codificación de los CSV del SAT | Resuelto el 25 de octubre: los 22 archivos se descargaron desde Chrome y se documentaron. | Nada. Ver la sección Datos extraídos del SAT. |
| Notificaciones por estrados | La página oficial de consulta (`sat.gob.mx/consultas/43671`) falló al cargar y la página de notificaciones bloquea acceso automatizado. | No sé si existe un listado descargable o API. Una nota de 2015 describe un listado web con archivos .zip de imágenes; no sé si sigue así. |
| Artículo 49 Bis en el portal del SAT | Varias fuentes dicen que se publica en el portal del SAT y en el DOF. No lo encontré en Datos Abiertos ni en otra página del SAT. | Por ahora la única fuente verificada es el DOF. |
| Publicaciones 49 Bis de agosto 2026 | Fuentes secundarias reportan oficios publicados el 7 y 14 de agosto de 2026. | No los consulté en la API del DOF; solo verifiqué los 3 del 10 de julio. |
| Frecuencia de actualización del SAT | La página solo muestra la fecha de corte de cada sección; no encontré un calendario. El artículo 69 muestra corte al 1 de julio de 2026, casi 4 meses antes de hoy. | No sé si es retraso o falta de cambios. El MCP debe reportar la fecha de corte en cada respuesta. |
| Términos de uso y límites de la API del DOF | Los documentos no mencionan token ni límites. `/apiStatus` dio error. | No sé si hay límites de tasa. Conviene pocas llamadas por día y caché local. |

**Fuera de alcance por requerir credenciales del contribuyente:** opinión de cumplimiento (32-D), constancia de situación fiscal y validación masiva de RFC. No los investigué en esta sesión; lo anoto por conocimiento general y conviene confirmarlo.

**Contribuyentes que dedujeron facturas de EFOS (EDOS):** no encontré un archivo separado en Datos Abiertos. No sé si están dentro de alguno de los archivos del artículo 69.

## Actualización de las fuentes: frecuencia, detección de cambios y velocidad

Ninguna fuente publica un calendario, así que medí la cadencia en los propios datos y en la API del DOF (25 de octubre de 2026).

- **La fuente más fresca para el 69-B es el portal del SAT:** presuntos una vez al mes y definitivos 2 veces al mes. El DOF publica lo mismo entre 7 y 9 semanas después.
- **El artículo 69 es trimestral.**
- **Detectar cambios en el SAT es barato:** 22 peticiones HEAD tardan menos de 1 segundo, gracias a que cada archivo trae un `Content-MD5` real.

### Cadencia medida

| Fuente | Cadencia observada en 2026 | Evidencia |
| --- | --- | --- |
| 69-B presuntos, página del SAT | 1 tanda al mes: 23/01, 18/02, 10/03, 08/04, 08/05, 05/06, 10/07, 07/08, 04/09 | Fechas de publicación en la página del SAT dentro del CSV. En el archivo modificado el 16 de octubre aún no hay tanda de octubre |
| 69-B definitivos, página del SAT | 2 tandas al mes, en pares separados por una semana (por ejemplo 15/09 y 22/09) | 18 fechas distintas en 2026 |
| 69-B sentencias favorables | Irregular: 20/02, 08/05, 11/05, 10/07, 07/08 | 5 fechas en 2026 |
| 69-B desvirtuados | Ninguna en 2026; la última en la página del SAT fue el 24/11/2025 | CSV |
| 69-B en el DOF | 12 días con publicaciones: 20/02, 06/03, 13/03, 30/04, 15/05, 05/06, 26/06, 03/07, 24/07, 18/09, 09/10 y 23/10 | Recorrí las 298 fechas del 1 de enero al 25 de octubre en la API |
| Retraso entre página del SAT y DOF | Presunción: mediana de 63 días (49 a 71). Definitivos: mediana de 53 días (32 a 70). En 2025 fue de 51 y 45 días | Cruce de ambas fechas en el CSV |
| 69-B Bis | DOF: 05/06 y 09/10. CSV: 3 registros | API del DOF y CSV |
| 49 Bis | DOF: 10/07, 07/08, 14/08 y 28/08 (14 oficios). No existe en CSV | API del DOF |
| Artículo 69 (firmes, no localizados, exigibles, cancelados, CSD) | Trimestral, el día 1 de enero, abril, julio y octubre: las 7 fechas desde 2025 caen ahí | La tanda del 1 de octubre de 2026 todavía no aparece, aunque los archivos se modificaron entre el 19 y el 22 de octubre |
| Archivos históricos (2007–2015, condonados, recargos, retorno de inversiones) | Sin cambios: última modificación el 16 de abril de 2026 y fechas de publicación que terminan entre 2016 y 2024 | Encabezados HTTP |

No encontré una regla oficial que fije la periodicidad. Revisé la [RMF 2026](https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/rmf/RMF_2026-DOF-28122025.pdf): las reglas 1.2, 1.4 y 1.5 no tratan de los listados, y la herramienta solo me entregó el documento hasta la regla 2.1.12. Por eso esta cadencia es empírica y puede cambiar sin aviso.

**Comprobación cruzada:** el oficio 500-05-00-00-00-2026-24732 se publicó en la página del SAT el 04/09/2026 y en el DOF el 23/10/2026. El CSV del 16 de octubre ya trae sus 171 contribuyentes, pero sin fecha de DOF. El HTML de esa nota del DOF (código 5801999) contiene exactamente 171 RFC.

### Cómo saber si una fuente cambió

**SAT (almacenamiento Azure):**

- Un `HEAD` regresa `ETag`, `Last-Modified` y `Content-MD5` en los 22 archivos. Comprobé en 3 archivos que el `Content-MD5` es el MD5 real de los bytes descargados.
- Un `GET` condicional con `If-None-Match` o `If-Modified-Since` regresa `304 Not Modified` (probado).
- Acepta `Range`: los primeros 200 bytes tardaron 76 ms. Sirve para leer el aviso de fecha de corte sin bajar el archivo.
- No permite listar el contenedor (regresa 404). Si el SAT agrega o renombra un archivo, solo se detecta revisando los enlaces de la página de Datos Abiertos.
- Un cambio de hash no implica publicaciones nuevas: los archivos del artículo 69 cambiaron el 19–22 de octubre sin la tanda trimestral. Para saber qué cambió hay que comparar contra la versión anterior (RFC que entran, salen o cambian).

**DOF:**

- La API no regresa `ETag`, `Last-Modified` ni compresión. Tampoco tiene una consulta de "cambios desde". La única forma es consultar `/notas/{fecha}` para la fecha del día.
- En 2026, 2,373 de 20,940 notas (11%) no traen título, y un filtro por título no las ve.
- La respuesta incluye `Access-Control-Allow-Origin: *` y lista `X-Auth-Token` entre los encabezados permitidos, aunque las llamadas funcionaron sin él.

**SOAP de CFDI:** es una consulta en vivo y no hay nada que detectar. No medí su latencia porque requiere un CFDI real.

### Velocidad medida

Medido desde tu Chrome y tu red el 25 de octubre de 2026. En el servidor de la oficina puede variar.

| Operación | Resultado |
| --- | --- |
| `HEAD` de 1 archivo del SAT | 0.35 s |
| `HEAD` de los 22 archivos en paralelo | 0.49 s |
| `Range` de 200 bytes | 0.08 s |
| `GET` de los 22 archivos en paralelo (79.7 MB) | 8.0 s, unos 80 Mbps |
| `GET` de los 22 archivos en secuencia | 14.3 s |
| DOF `/notas/{fecha}`, 298 fechas con 4 en paralelo | 13.2 s en total, 0 errores; mediana 165 ms, p95 286 ms, máximo 438 ms; 28 KB en promedio |
| DOF `/notas/nota/5801999` (listado 69-B de 171 RFC) | 10.0 s y 3.2 MB, de los cuales 2.2 MB son HTML |

### Estrategia de requests recomendada

1. **SAT:** `HEAD` en paralelo a los 22 archivos; comparar `Content-MD5` contra el último guardado y bajar solo los que cambiaron, también en paralelo. Si en algún momento falta `Content-MD5`, usar `ETag` o el `GET` condicional. El peor caso (todo cambió) son unos 8 s.
2. **Fecha de corte:** leer con `Range` los primeros bytes del 69-B y del 69-B Bis para el aviso "Información actualizada al".
3. **DOF:** consultar `/notas/{fecha}` del día por la mañana y por la tarde (hay ediciones matutina, vespertina y extraordinaria). Bajar el detalle solo de las notas que coincidan con 69-B, 69-B Bis, 49 Bis o medios de defensa, con un timeout de al menos 60 s porque un listado pesa varios MB.
4. **Concurrencia en el DOF:** 4 peticiones en paralelo funcionaron sin errores en 298 llamadas. No hay límites documentados, así que no subiría de ahí.
5. **Fuera del camino de Claude:** toda la descarga ocurre en la ingesta. El MCP responde desde la base local, en milisegundos y sin depender de que el SAT o el DOF estén en línea.
6. **Carga inicial:** recorrer el DOF de todo 2026 tomó 13 s para las listas de notas; lo pesado son los detalles de las notas de listados.

### Limitantes

- **Sin calendario oficial ni compromisos de disponibilidad.** La cadencia es la observada y puede cambiar.
- **Las fechas de corte no son confiables:** el aviso del 69-B dice 30 de septiembre, pero los datos llegan al 9 de octubre.
- **Datos atrasados:**
  - Las fechas de DOF del CSV se llenan solo cuando el SAT vuelve a subir el archivo: la tanda del 04/09 ya salió en el DOF el 23/10, pero el archivo del 16/10 no lo refleja.
  - El artículo 69 puede tener más de 3 meses de antigüedad.
- **Rutas frágiles:** sin listado del contenedor, un archivo nuevo o renombrado pasa desapercibido. Además, la página usa carpetas con fecha en la ruta (por ejemplo `AGR/03_02_26/`).
- **Formato sin contrato:**
  - `Content-Type` incorrecto y codificación Windows-1252, con fragmentos CP850 en los históricos.
  - El servidor usa la versión `2009-09-19` de la API de Azure. Si el SAT cambia cómo sube los archivos, `Content-MD5` podría desaparecer.
- **API del DOF:**
  - La documentación apunta al host de pruebas.
  - `/apiStatus` falló y no hay límites documentados.
  - Las notas de listados vienen como HTML grande cuya estructura puede cambiar.
- **Red de la oficina:** la ingesta necesita salida HTTPS a 3 hosts. Mi entorno en la nube no podía llegar al almacenamiento del SAT, así que un proxy corporativo también podría bloquearlo.
- **Sin fuente verificada:** estrados, y el 49 Bis en el portal del SAT.

### Mantenimiento previsto

| Qué vigilar | Cómo | Umbral inicial |
| --- | --- | --- |
| Esquema de cada archivo | Comparar encabezados contra los documentados (20, 12, 6 a 8 columnas) | Cualquier diferencia detiene la carga de ese archivo |
| Integridad del 69-B | El completo debe ser igual a la suma de los 4 sub-listados | Cualquier diferencia |
| Volumen | Variación de filas contra la descarga anterior | Configurable; empezar con 5% de caída |
| Frescura del 69-B | Días sin nueva fecha de presuntos en la página del SAT | Alertar a los 45 días (hoy es mensual) |
| Frescura del artículo 69 | Días desde la última fecha trimestral | Alertar a los 100 días |
| Archivos nuevos o renombrados | Comparar los enlaces de la página de Datos Abiertos | Semanal |
| Parser del DOF | Pruebas con notas reales: 5793257 (49 Bis) y 5801999 (69-B, 171 RFC) | En cada despliegue |
| Notas del DOF sin título | Muestrear su contenido | Revisión mensual al inicio |
| Codificación | Contar caracteres sospechosos (`¥`, `Ã`, controles) tras convertir | Cualquier aumento |
| Cambios legales | El 49 Bis entró con la reforma al CFF vigente desde el 1 de enero de 2026. Reformas así pueden agregar o cambiar listas | Revisar cada año entre noviembre y enero (paquete económico y nueva RMF) |

## Requerimientos técnicos del conector

El conector es un servicio MCP de solo lectura, empaquetado en Docker. Un proceso descarga las fuentes a una base local y el servidor MCP responde a Claude desde esa base, salvo la consulta de CFDI, que va en vivo al SAT. Claude Enterprise lo usa como conector personalizado remoto.

&#91;embedded content: arquitectura del conector · 4 componentes, 3 fuentes públicas\]

Claude solo habla con el proxy. Las listas se leen de la base local; solo la verificación de CFDI sale en vivo al SAT.

### Opciones de despliegue

Según la [documentación de Claude](https://support.claude.com/en/articles/11175166), los conectores remotos se llaman desde la nube de Anthropic. Un servidor en una red corporativa privada, detrás de VPN o bloqueado por firewall no conecta, a menos que se permita el rango de salida de Anthropic `160.79.104.0/21` ([IPs de Anthropic](https://platform.claude.com/docs/en/api/ip-addresses)).

| Opción | Funciona en | Requisito de red | Cuándo elegirla |
| --- | --- | --- | --- |
| A. Servidor en la oficina, expuesto con allowlist | claude.ai, Claude Desktop y móvil (móvil solo usa conectores ya agregados) | HTTPS entrante en un dominio público, aceptando solo `160.79.104.0/21` | La oficina controla su firewall y puede abrir el puerto 443 |
| B. Servidor fuera de la oficina (VPS o nube) | Igual que A | Ninguno en la oficina | La oficina no puede abrir tráfico entrante; los datos ya son públicos |
| C. MCP local en cada equipo | Solo Claude Desktop vía `claude_desktop_config.json`; no claude.ai ni Cowork | Ninguno | Piloto con pocas personas |

**Recomendación:** A si la oficina puede abrir 443 con allowlist; si no, B. La misma imagen Docker sirve para A y B; C requiere además modo stdio.

### Componentes

1. **Ingesta:** proceso programado que descarga SAT y DOF, valida y escribe en la base.
2. **Base de datos:** PostgreSQL, o SQLite si todo vive en un solo contenedor.
3. **Servidor MCP:** transporte Streamable HTTP, sin estado propio; lee la base y llama al SOAP del SAT para CFDI.
4. **Proxy inverso:** termina TLS, aplica la allowlist de IPs y el límite de peticiones.
5. **Autorización:** OAuth contra el proveedor de identidad de la oficina, o una credencial fija por encabezado.

### Herramientas MCP

Todas son de solo lectura y cada respuesta incluye la URL de la fuente y su fecha de corte.

| Tool | Entrada | Salida | Fuente |
| --- | --- | --- | --- |
| `buscar_rfc` | RFC | Listas donde aparece, situación, fechas, oficio y fecha de corte | CSV del SAT + 49 Bis del DOF |
| `buscar_nombre` | Razón social | Coincidencias aproximadas con su RFC | Igual |
| `revisar_proveedores` | Lista de RFC (tope configurable) | Resultado por RFC | Igual |
| `verificar_cfdi` | UUID, RFC emisor, RFC receptor, total | Estado, cancelabilidad y `ValidacionEFOS` | SOAP del SAT, en vivo |
| `publicaciones_dof` | Rango de fechas y tipo (69-B, 69-B Bis, 49 Bis) | Notas con código, título y fecha | Caché del DOF |
| `leer_nota_dof` | `codNota` | Texto limpio y RFC extraídos | DOF |
| `estado_fuentes` | Ninguna | Última descarga exitosa y fecha de corte por fuente | Interna |

### Ingesta y calidad de datos

- **SAT:** descarga diaria de los 22 CSV; si el hash no cambió, no reprocesar. Parser configurado por archivo, después de documentar columnas y codificación (ver *Huecos*).
- **Historial:** guardar cada versión para saber cuándo entró o salió un RFC de una lista.
- **Protección:** si cambian los encabezados o el número de filas cae más de un umbral configurable, no reemplazar los datos y alertar.
- **DOF:** consultar `/notas/{fecha}` después de las ediciones matutina y vespertina, y revisar extraordinarias. Filtrar títulos que mencionen 69-B, 69-B Bis o 49 Bis; descargar cada nota y extraer RFC del HTML de `cadenaContenido`. Marcar esos registros como extraídos automáticamente, con enlace a la nota.
- **Carga inicial del DOF:** desde el 1 de enero de 2026, fecha de entrada en vigor del 49 Bis.
- **Salida a internet que necesita el contenedor:** `wu1agsprosta001.blob.core.windows.net`, `sidof.segob.gob.mx` y `consultaqr.facturaelectronica.sat.gob.mx`, por HTTPS.

### Requisitos de Claude Enterprise

Tomados de la [guía de conectores](https://support.claude.com/en/articles/11175166) y de la [guía para construirlos](https://support.claude.com/en/articles/11503834):

- **Transporte:** Streamable HTTP. SSE también se acepta, pero Anthropic indica que podría dejar de soportarse.
- **Autorización:** OAuth con registro dinámico de clientes, o un client ID y secret propios; specs del 26/03 y 18/06 soportadas; implementar expiración y refresco de tokens. Callback a permitir: `https://claude.ai/api/mcp/auth_callback` (podría cambiar a un dominio `claude.com`, así que conviene permitir ambos).
- **Alternativa sin OAuth:** credencial fija enviada como encabezado. En Team y Enterprise la comparten todos los usuarios, así que debe tener permisos mínimos.
- **Quién lo agrega:** Owners, Primary Owners o un rol personalizado con permiso *Manage access to Libraries*. Después, cada miembro conecta su cuenta.
- **Capacidades:** tools, prompts y resources. No se soportan sampling ni suscripciones a resources.
- **Cambios:** editar un conector implica quitarlo y volver a agregarlo, así que la URL del servidor debe ser estable.

### Docker e infraestructura

- Imagen multi-arquitectura (`linux/amd64` y `linux/arm64`) hasta conocer el servidor de la oficina.
- `docker compose` con servicios `mcp`, `ingesta`, `db` y `proxy`; volúmenes para la base y los certificados; healthcheck en cada servicio.
- Configuración por variables de entorno; secretos fuera de la imagen.
- Para A y B: un subdominio y un certificado TLS público.
- Recursos de CPU, RAM y disco: no los medí. Se dimensionan después de la primera carga completa.

### Seguridad

- Allowlist de entrada `160.79.104.0/21` en firewall o proxy. La página de Anthropic lista además 5 IPs antiguas que ya no se usan y deben quitarse de cualquier allowlist.
- Las listas que mandan los usuarios a `revisar_proveedores` no se guardan por defecto, y los logs no registran el contenido de las peticiones.
- Límite de peticiones por usuario.
- Cada respuesta aclara que es información de listas públicas y no sustituye la revisión fiscal o legal.

### Operación (mantenida por ti)

- Endpoint de salud y logs estructurados.
- Alerta si falla una ingesta o si la fecha de corte de una fuente no avanza en N días (configurable).
- Respaldo de la base.
- Imágenes versionadas con changelog.
- Pruebas con archivos reales del SAT y notas reales del DOF (por ejemplo, 5793257 para 49 Bis).

## Preguntas abiertas y siguientes pasos

La primera pregunta decide entre las opciones A, B y C; las demás ajustan el diseño.

**Para la oficina:**

- ¿Qué servidor tienen: sistema operativo, arquitectura de CPU, si ya corre Docker y cuánta RAM y disco tiene libres?
- ¿Pueden publicar un subdominio con HTTPS entrante y limitarlo al rango `160.79.104.0/21`? ¿Quién administra el firewall?
- ¿Qué proveedor de identidad usan (por ejemplo Microsoft Entra ID o Google Workspace) para OAuth?
- ¿Qué listas les importan? ¿Todo el artículo 69, incluidos condonados y retorno de inversiones, o solo 69-B, 69-B Bis, 49 Bis y no localizados?
- ¿Necesitan estrados? Si sí, hay que investigarlo a mano porque no pude acceder.
- ¿Cuánto historial quieren conservar?

**Siguientes pasos:**

1. Confirmar el servidor y la red de la oficina.
2. Guardar en disco los 22 CSV convertidos (hecho en memoria el 25 de octubre; falta escribirlos).
3. Investigar a mano la consulta de estrados en el portal del SAT.
4. Prototipo con `buscar_rfc`, `publicaciones_dof` y `estado_fuentes` en modo local (opción C) para validar parsers.
5. Desplegar en A o B, dar de alta el conector en Claude Enterprise y hacer un piloto con 2 o 3 usuarios.

## Fuentes consultadas

- [SAT · Datos abiertos, contribuyentes publicados](https://www.sat.gob.mx/minisitio/DatosAbiertos/contribuyentes_publicados.html)
- [SAT · Documentación del servicio de consulta de CFDI v1.3](https://www.sat.gob.mx/minisitio/Factura/documentos/cancelacion/consulta_cfdi.pdf)
- [phpcfdi/sat-estado-cfdi](https://github.com/phpcfdi/sat-estado-cfdi)
- [SIDOF · Datos abiertos](https://sidof.segob.gob.mx/datos_abiertos), con las fichas de [Notas](https://sidof.segob.gob.mx/datos_abiertos/getPDF/57), [Diario](https://sidof.segob.gob.mx/datos_abiertos/getPDF/65) y [Documentos](https://sidof.segob.gob.mx/datos_abiertos/getPDF/43)
- [Claude · Conectores personalizados con MCP remoto](https://support.claude.com/en/articles/11175166)
- [Claude · Construir conectores personalizados](https://support.claude.com/en/articles/11503834)
- [Anthropic · Direcciones IP](https://platform.claude.com/docs/en/api/ip-addresses)
- [IDC Online · Cómo revisar una notificación por estrados (2015)](https://idconline.mx/fiscal/2015/06/22/cmo-revisar-una-notificacin-por-estrados-del-sat)
- [Incomex · Nueva lista 49 Bis (agosto 2026)](https://incomex.org.mx/index.php/2026/08/17/sat-lista-49bis-facturas-falsas/)
