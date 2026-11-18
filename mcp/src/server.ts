import { McpServer } from "@modelcontextprotocol/server";
import type { DofContext } from "./dof/context.ts";
import { registerDofTools } from "./tools/dof.ts";

export const SERVER_INFO = { name: "sat-dof-mcp", version: "0.1.0" } as const;

const INSTRUCTIONS = `Data from the Diario Oficial de la Federación (DOF), Mexico's official gazette. Everything the DOF publishes is in Spanish.

- Answer in the language the user writes in.
- Search and filter with Spanish text: titles and issuer names are in Spanish.
- Quote titles, issuer names, indicator names and other DOF terms as published. Do not translate them; you may add a translation next to them.
- When you answer in Spanish, give the disclaimer in aviso word for word.`;

/** The transport calls it; the context, with its client and caches, is created once and passed in. */
export function createServer(dof: DofContext): McpServer {
  const server = new McpServer(SERVER_INFO, { instructions: INSTRUCTIONS });
  registerDofTools(server, dof);
  return server;
}
