/** Not part of `bun test`: it needs the network and its answers change every day. */
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { DofClient, DofError } from "../src/dof/client.ts";
import { INDICATORS } from "../src/dof/indicators.ts";
import { parseOutput, type ToolName, type ToolOutput } from "../test/helpers/narrow.ts";

const client = new Client({ name: "smoke", version: "1.0.0" });
await client.connect(
  new StdioClientTransport({ command: process.execPath, args: ["run", join(import.meta.dir, "..", "src", "index.ts")] }),
);

async function call<N extends ToolName>(name: N, args: Record<string, unknown> = {}): Promise<ToolOutput<N>> {
  const started = Date.now();
  const result = await client.callTool({ name, arguments: args });
  const text = (result.content as { text: string }[])[0]?.text ?? "";
  assert.ok(!result.isError, `${name} ${JSON.stringify(args)} failed: ${text}`);
  console.error(`ok ${name} ${JSON.stringify(args)}  ${text.length} chars, ${Date.now() - started} ms`);
  return parseOutput(name, result);
}

const { tools } = await client.listTools();
assert.equal(tools.length, 4, "four DOF tools");

const estado = await call("dof_estado");
console.error(`   today ${estado.hoy_cdmx}, latest edition ${estado.ultima_edicion.fecha}: ${estado.ultima_edicion.ediciones.map((e) => `${e.edicion} ${e.paginas ?? "?"} p.`).join(", ")}`);
for (const item of estado.indicadores) {
  console.error(`   ${item.indicador.padEnd(12)} ${item.fecha_mas_reciente} ${item.valor_original}${item.publicado_hasta ? `  (published through ${item.publicado_hasta})` : ""}`);
}
assert.ok(estado.ultima_edicion.fecha <= estado.hoy_cdmx);

const latest = await call("dof_publicaciones");
assert.ok(latest.total_count > 0, "the latest edition has notes");
assert.equal(latest.fecha_desde, estado.ultima_edicion.fecha);
const firstNote = latest.publicaciones[0];
assert.ok(firstNote, "the first page of the latest edition has notes");
console.error(`   ${latest.total_count} notes; first: ${firstNote.titulo.slice(0, 80)}`);

const whole = await call("dof_publicaciones", { limit: 200 });
if (whole.count < whole.total_count) assert.equal(whole.next_offset, whole.count, "a shortened page points at the first note left out");

const week = await call("dof_publicaciones", { fecha_desde: addDays(estado.hoy_cdmx, -6), fecha_hasta: estado.hoy_cdmx, limit: 5 });
console.error(`   last 7 days: ${week.total_count} notes, no edition on ${week.fechas_sin_edicion.join(", ") || "none"}`);

const words = firstNote.titulo.split(/\s+/).slice(0, 3).join(" ").replace(/[^\p{L}\p{N} ]/gu, "");
const found = await call("dof_buscar_notas", { texto: words, limit: 5 });
assert.ok(found.total_count > 0, "searching the first words of a published title finds it");
const four = await call("dof_buscar_notas", { texto: words, limit: 4 });
const shifted = await call("dof_buscar_notas", { texto: words, limit: 3, offset: 1 });
assert.deepEqual(
  shifted.notas.map((nota) => nota.cod_nota),
  four.notas.slice(1, 4).map((nota) => nota.cod_nota),
  "an offset that is not a multiple of limit returns the right notes",
);
const oldest = await call("dof_buscar_notas", { texto: words, limit: 2, orden: "antiguas" });
const [oldestNote] = oldest.notas;
const [newestNote] = found.notas;
assert.ok(oldestNote !== undefined && newestNote !== undefined && oldestNote.fecha <= newestNote.fecha, "antiguas starts from the oldest");

const valores = await call("dof_indicadores");
const sample = valores.valores[0];
assert.ok(sample, "there is a latest value for some indicator");
const serie = await call("dof_indicadores", { indicador: sample.indicador, fecha_desde: addDays(estado.hoy_cdmx, -30) });
assert.ok(serie.total_count > 0, "a month of the first indicator has values");
await call("dof_indicadores", { fecha: estado.ultima_edicion.fecha });

const invalid = await client.callTool({ name: "dof_publicaciones", arguments: { fecha_desde: "no-es-fecha" } });
assert.equal(invalid.isError, true, "an invalid date is rejected");

await client.close();

const timedOut = await new DofClient().notesByDate(estado.ultima_edicion.fecha, { timeoutMs: 1 }).catch((error: unknown) => error);
assert.ok(timedOut instanceof DofError && timedOut.kind === "timeout", `expected a timeout, got ${String(timedOut)}`);
console.error("ok a 1 ms timeout is reported as a timeout");

const catalog = (await new DofClient().indicatorCatalog()).data.lista;
assert.deepEqual(
  INDICATORS.map((info) => `${info.code} ${info.catalogName}`).sort(),
  catalog.map((row) => `${row.id} ${row.value}`).sort(),
  "src/dof/indicators.ts is out of date with the DOF catalog",
);
console.error("ok indicator table matches the live catalog");
console.error("Smoke test passed");

function addDays(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}
