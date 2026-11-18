# sat_dof_mcp

A Claude plugin that lets Claude answer questions from Mexican public tax data: the SAT's published-taxpayer lists (articles 69, 69-B and 69-B Bis of the Código Fiscal de la Federación), the Diario Oficial de la Federación, and the SAT's invoice status service. The plugin bundles an MCP server that runs on the user's machine.

It is being built to test locally and then offer at a law firm. The aim is to serve each source's data as up to date as the source allows, so that answers are accurate and relevant. Those answers come from public lists and do not replace a tax or legal review.

## Status

Design stage. `mcp/` holds a Bun and TypeScript scaffold with no server code yet.

## Documents

| Document | What it answers |
| --- | --- |
| [docs/design_connector.md](docs/design_connector.md) | What gets built: architecture, deduplication, tools, tests, risks and open decisions |
| [docs/sources.md](docs/sources.md) | What each source serves, how it behaves over HTTP and how often it changes |
| [docs/data_relationships.md](docs/data_relationships.md) | What one row is in each source, and how the sources join |
| [docs/glossary.md](docs/glossary.md) | The legal meaning of each list and term |

## Run

```bash
cd mcp && bun install && bun run index.ts
```
