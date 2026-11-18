# sat_dof_mcp

A Claude plugin whose MCP server answers from Mexican public tax data: SAT taxpayer lists and the DOF gazette.

## Scope of this file

Environment only: runtime, layout and standing rules. Project status, decisions and history belong in `docs/`, which is the record. Save to agent memory only what fits this same scope.

## Runtime

- Bun 1.4.4 or later and TypeScript, run from `mcp/`. Scripts are in `mcp/package.json`.
- Use Bun's built-ins: `bun:sqlite`, `Bun.file`, `Bun.$`, `bun test`. Bun loads `.env` itself.
- In local development the MCP server speaks stdio, where stdout carries the protocol: log with `console.error`. A hosted server uses Streamable HTTP.

## Layout

- `mcp/`: server code.
- `docs/`: design and source reference. Read `docs/design_connector.md` first.
- `docs/sat_listas_*/`: SAT list snapshots. Git tracks only each `manifest.json`.

## Data guard

Leave every untracked file under `docs/sat_listas_*/` in place and out of commits. Some are the only copy of lists the SAT has since replaced.

## Language

English prose. Tool names, list names and column names stay in Spanish, as the sources write them.
