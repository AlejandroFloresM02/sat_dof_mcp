/** Tests name a fixture by its `caso` and take dates from the manifest's scenario, so no test writes a date. */
import { join } from "node:path";
import type { FetchLike } from "../../src/dof/client.ts";
import manifest from "../fixtures/dof/manifest.json";

const FIXTURE_DIR = join(import.meta.dir, "..", "fixtures", "dof");

export const scenario = manifest.escenario;
export const entries = manifest.archivos;
export type FixtureEntry = (typeof entries)[number];

export function entry(caso: string): FixtureEntry {
  const found = entries.find((item) => item.caso === caso);
  if (found === undefined) throw new Error(`No fixture for case ${caso}. Run: bun run capture:dof`);
  return found;
}

export function body(caso: string): Promise<string> {
  return Bun.file(join(FIXTURE_DIR, entry(caso).archivo)).text();
}

export async function json(caso: string): Promise<any> {
  return JSON.parse(await body(caso));
}

function respond(item: FixtureEntry): Response {
  return new Response(Bun.file(join(FIXTURE_DIR, item.archivo)), {
    status: item.status,
    headers: item.content_type === null ? {} : { "content-type": item.content_type },
  });
}

export interface FixtureFetch extends FetchLike {
  calls: string[];
  missing: string[];
}

export function fixtureFetch(): FixtureFetch {
  const byUrl = new Map(entries.map((item) => [item.url, item]));
  const fetchFixture: FixtureFetch = Object.assign(
    async (url: string) => {
      fetchFixture.calls.push(url);
      const item = byUrl.get(url);
      if (item === undefined) {
        fetchFixture.missing.push(url);
        throw new Error(`No fixture for ${url}`);
      }
      return respond(item);
    },
    { calls: [] as string[], missing: [] as string[] },
  );
  return fetchFixture;
}

export function alwaysFetch(caso: string): FetchLike {
  return async () => respond(entry(caso));
}

/** Midday in Mexico City, so the date is the same there and in UTC. */
export function clockAt(date: string): () => Date {
  return () => new Date(`${date}T18:00:00.000Z`);
}
