#!/usr/bin/env bun
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { DofContext } from "./dof/context.ts";
import { createServer, SERVER_INFO } from "./server.ts";

const dof = new DofContext();
serveStdio(() => createServer(dof));
console.error(`${SERVER_INFO.name} ${SERVER_INFO.version} running on stdio`);
