# sat_dof_mcp

A Claude plugin whose MCP server answers from Mexican public tax data: SAT taxpayer lists and the DOF gazette.

## Scope of this file

Environment only: runtime, layout and standing rules. Save to agent memory only what fits this same scope.

## Source of truth

- The code is the only description of what is built. Do not restate it in `docs/` or in comments.
- `docs/` holds what the code cannot: plans for what is not built, open decisions and measurements of the sources. When something is built, remove its description from `docs/`.
- Keep a comment only when no name, type or test states the fact and a maintainer would get it wrong without it.

## Runtime

- Bun 1.4.4 or later and TypeScript, run from `mcp/`. Scripts are in `mcp/package.json`.
- Use Bun's built-ins: `bun:sqlite`, `Bun.file`, `Bun.$`, `bun test`. Bun loads `.env` itself.
- In local development the MCP server speaks stdio, where stdout carries the protocol: log with `console.error`. A hosted server uses Streamable HTTP.

## Layout

- `mcp/`: server code.
- `docs/`: plans and source reference for what is not built yet. Read `docs/design_connector.md` first.
- `docs/sat_listas_*/`: SAT list snapshots. Git tracks only each `manifest.json`.

## Data guard

Leave every untracked file under `docs/sat_listas_*/` in place and out of commits. Some are the only copy of lists the SAT has since replaced.

## Language

English prose, including what the agent reads from the server: tool titles, descriptions, hints and error messages.

Spanish stays for tool, parameter, list and column names, for terms that exist only in Spanish, for the disclaimer shown to users and for examples of search text.
