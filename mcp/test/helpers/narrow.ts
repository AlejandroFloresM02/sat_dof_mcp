import type { CallToolResult } from "@modelcontextprotocol/client";
import type * as z from "zod/v4";
import { BuscarOutput, EstadoOutput, IndicadoresOutput, PublicacionesOutput } from "../../src/tools/dof.ts";

const OUTPUTS = {
  dof_buscar_notas: BuscarOutput,
  dof_estado: EstadoOutput,
  dof_indicadores: IndicadoresOutput,
  dof_publicaciones: PublicacionesOutput,
};

export type ToolName = keyof typeof OUTPUTS;
export type ToolOutput<N extends ToolName> = z.infer<(typeof OUTPUTS)[N]>;

const schemas: { [N in ToolName]: z.ZodType<ToolOutput<N>> } = OUTPUTS;

export function parseOutput<N extends ToolName>(name: N, result: CallToolResult): ToolOutput<N> {
  return schemas[name].parse(result.structuredContent);
}

export function textOf(result: CallToolResult): string {
  const [block] = result.content;
  if (block?.type !== "text") throw new Error(`Expected a text block first, got ${JSON.stringify(result.content)}`);
  return block.text;
}

export function defined<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`Expected ${what}`);
  return value;
}
