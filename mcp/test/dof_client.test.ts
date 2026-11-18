import { afterAll, describe, expect, test } from "bun:test";
import { DofClient, DofError, type DofErrorKind, type FetchLike } from "../src/dof/client.ts";
import { MAX_CONCURRENT_REQUESTS } from "../src/dof/constants.ts";
import { Freshness } from "../src/dof/freshness.ts";
import { addDays } from "../src/dof/dates.ts";
import { alwaysFetch, clockAt, entry, fixtureFetch, scenario } from "./helpers/fixtures.ts";

async function kindOf(promise: Promise<unknown>): Promise<DofErrorKind | "resolved"> {
  try {
    await promise;
    return "resolved";
  } catch (error) {
    if (error instanceof DofError) return error.kind;
    throw error;
  }
}

describe("how the client reads each kind of failure", () => {
  const cases: [caso: string, kind: DofErrorKind][] = [
    ["diarios_hoy_menos_0", "no_data"],
    ["indicadores_fecha_lejana", "no_data"],
    ["ruta_inexistente", "route_missing"],
    ["notas_fecha_formato_iso", "invalid_input"],
    ["notas_fecha_imposible", "source_down"],
    ["nota_detalle_no_numerica", "source_down"],
  ];

  test.each(cases)("%s is %s", async (caso, kind) => {
    const client = new DofClient({ fetch: alwaysFetch(caso) });
    expect(await kindOf(client.editionsByDate(scenario.hoy))).toBe(kind);
  });

  test("a 200 whose body is another route's shape is an unexpected response", async () => {
    const client = new DofClient({ fetch: alwaysFetch("catalogo_indicadores") });
    expect(await kindOf(client.notesByDate(scenario.hoy))).toBe("unexpected_response");
  });

  test("a 200 that is not JSON is an unexpected response", async () => {
    const client = new DofClient({ fetch: async () => new Response("<html>mantenimiento</html>", { status: 200 }) });
    expect(await kindOf(client.notesByDate(scenario.hoy))).toBe("unexpected_response");
  });

  test("a 404 that is not the API's own NOT_FOUND is a missing route, not missing data", async () => {
    const client = new DofClient({ fetch: async () => new Response("<html>404</html>", { status: 404 }) });
    expect(await kindOf(client.editionsByDate(scenario.hoy))).toBe("route_missing");
  });

  test("a timeout and a refused connection are told apart", async () => {
    const timeout = new DofClient({ fetch: async () => Promise.reject(new DOMException("timed out", "TimeoutError")) });
    const refused = new DofClient({ fetch: async () => Promise.reject(new TypeError("fetch failed")) });
    expect(await kindOf(timeout.notesByDate(scenario.hoy))).toBe("timeout");
    expect(await kindOf(refused.notesByDate(scenario.hoy))).toBe("source_down");
  });

  test("a cancelled call is not reported as a DOF failure", async () => {
    const client = new DofClient({ fetch: async () => Promise.reject(new DOMException("aborted", "AbortError")) });
    expect(client.notesByDate(scenario.hoy)).rejects.toBeInstanceOf(DOMException);
  });

  test("error messages name the address that failed", async () => {
    const client = new DofClient({ fetch: alwaysFetch("notas_fecha_imposible") });
    const error = await client.notesByDate(scenario.hoy).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(DofError);
    expect((error as DofError).message).toContain((error as DofError).url);
  });
});

describe("real timeouts, against a local server that stalls", () => {
  // Nothing here is injected: Bun's own fetch must raise the timeout the client expects.
  const server = Bun.serve({
    port: 0,
    async fetch(request) {
      if (new URL(request.url).pathname.startsWith("/headers")) {
        await Bun.sleep(5_000);
        return new Response("{}");
      }
      // Sends the headers and the start of a body, then never finishes it.
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('{"messageCode":200,'));
          },
        }),
        { headers: { "content-type": "application/json" } },
      );
    },
  });
  afterAll(() => server.stop(true));

  test.each([["headers"], ["body"]])("a server that stalls on the %s is a timeout", async (stage) => {
    const client = new DofClient({ baseUrl: `http://localhost:${server.port}/${stage}` });
    const started = Date.now();
    expect(await kindOf(client.notesByDate(scenario.hoy, { timeoutMs: 150 }))).toBe("timeout");
    expect(Date.now() - started).toBeLessThan(3_000);
  });

  test("cancelling the call stops it without calling it a DOF failure", async () => {
    const client = new DofClient({ baseUrl: `http://localhost:${server.port}/headers` });
    const controller = new AbortController();
    const pending = client.notesByDate(scenario.hoy, { signal: controller.signal });
    controller.abort();
    const error = await pending.catch((caught: unknown) => caught);
    expect(error).not.toBeInstanceOf(DofError);
    expect((error as Error).name).toBe("AbortError");
  });
});

describe("requests", () => {
  test("dates are sent zero-padded as DD-MM-YYYY", async () => {
    const fetch = fixtureFetch();
    await new DofClient({ fetch }).notesByDate(scenario.ultima_edicion);
    expect(fetch.missing).toEqual([]);
    expect(fetch.calls).toEqual([entry(`notas_hoy_menos_${scenario.dias.length - 1}`).url]);
  });

  test("search text cannot change the route", async () => {
    const calls: string[] = [];
    const fetch: FetchLike = async (url) => {
      calls.push(url);
      return alwaysFetch("buscar_titulo_sin_resultados")(url);
    };
    await new DofClient({ fetch }).searchTitles("a/b\\c;d%e ?#", 1, 5, "desc");
    const path = new URL(calls[0]!).pathname;
    expect(path.split("/").filter((part) => part !== "")).toHaveLength(9);
    expect(path).not.toContain(";");
  });

  test(`never more than ${MAX_CONCURRENT_REQUESTS} at once`, async () => {
    let active = 0;
    let peak = 0;
    const fetch: FetchLike = async (url) => {
      peak = Math.max(peak, ++active);
      await Bun.sleep(2);
      active--;
      return alwaysFetch("notas_hoy_menos_0")(url);
    };
    const client = new DofClient({ fetch });
    await Promise.all(Array.from({ length: MAX_CONCURRENT_REQUESTS * 5 }, () => client.notesByDate(scenario.hoy)));
    expect(peak).toBe(MAX_CONCURRENT_REQUESTS);
  });
});

describe("latest edition", () => {
  test("walks back over the days without an edition", async () => {
    const fetch = fixtureFetch();
    const freshness = new Freshness(new DofClient({ fetch }), { now: clockAt(scenario.hoy) });
    const latest = await freshness.latestEdition();

    expect(fetch.missing).toEqual([]);
    expect(latest.fecha).toBe(scenario.ultima_edicion);
    expect(latest.hoy_cdmx).toBe(scenario.hoy);
    expect(latest.dias_revisados).toBe(scenario.dias.length);
    expect(latest.ediciones.length).toBeGreaterThan(0);
    expect(fetch.calls).toHaveLength(scenario.dias.length);
  });

  test("is found at once when today has an edition", async () => {
    const fetch = fixtureFetch();
    const freshness = new Freshness(new DofClient({ fetch }), { now: clockAt(scenario.ultima_edicion) });
    const latest = await freshness.latestEdition();
    expect(latest.fecha).toBe(scenario.ultima_edicion);
    expect(latest.dias_revisados).toBe(1);
  });

  test("the answer is reused until it expires or the day changes", async () => {
    const fetch = fixtureFetch();
    let now = clockAt(scenario.hoy)();
    const freshness = new Freshness(new DofClient({ fetch }), { now: () => now, ttlMs: 60_000 });
    await freshness.latestEdition();
    await freshness.latestEdition();
    expect(fetch.calls).toHaveLength(scenario.dias.length);

    now = new Date(now.getTime() + 61_000);
    await freshness.latestEdition();
    expect(fetch.calls).toHaveLength(scenario.dias.length * 2);

    freshness.reset();
    await freshness.latestEdition();
    expect(fetch.calls).toHaveLength(scenario.dias.length * 3);
  });

  const outages: [name: string, caso: string, kind: DofErrorKind][] = [
    ["a server error", "notas_fecha_imposible", "source_down"],
    ["a route the API no longer knows", "ruta_inexistente", "route_missing"],
  ];
  test.each(outages)("%s stops the walk instead of reporting an older date", async (_name, caso, kind) => {
    const fixtures = fixtureFetch();
    const failing = alwaysFetch(caso);
    // Today fails; every earlier day would answer normally.
    const fetch: FetchLike = (url) => (url === entry("diarios_hoy_menos_0").url ? failing(url) : fixtures(url));
    const freshness = new Freshness(new DofClient({ fetch }), { now: clockAt(scenario.hoy) });
    expect(await kindOf(freshness.latestEdition())).toBe(kind);
    expect(fixtures.calls).toEqual([]);
  });

  test("a failure is not cached", async () => {
    let fail = true;
    const fixtures = fixtureFetch();
    const fetch: FetchLike = (url) => (fail ? alwaysFetch("notas_fecha_imposible")(url) : fixtures(url));
    const freshness = new Freshness(new DofClient({ fetch }), { now: clockAt(scenario.hoy) });
    expect(await kindOf(freshness.latestEdition())).toBe("source_down");
    fail = false;
    expect((await freshness.latestEdition()).fecha).toBe(scenario.ultima_edicion);
  });

  test("no edition in the whole window is an error, never a date", async () => {
    const maxDays = 4;
    let calls = 0;
    const fetch: FetchLike = (url) => {
      calls++;
      return alwaysFetch("diarios_hoy_menos_0")(url);
    };
    const freshness = new Freshness(new DofClient({ fetch }), { now: clockAt(scenario.hoy), maxDays });
    expect(await kindOf(freshness.latestEdition())).toBe("unexpected_response");
    expect(calls).toBe(maxDays);
  });
});

describe("latest indicators", () => {
  test("each indicator reports its own latest date, and values published ahead are separate", async () => {
    const fetch = fixtureFetch();
    const freshness = new Freshness(new DofClient({ fetch }), { now: clockAt(scenario.hoy) });
    const state = await freshness.latestIndicators();

    expect(fetch.missing).toEqual([]);
    expect(state.ventana_desde).toBe(scenario.indicadores_desde);
    expect(state.ventana_hasta).toBe(scenario.indicadores_hasta);
    expect(state.indicadores.length).toBeGreaterThan(0);
    for (const item of state.indicadores) {
      expect(item.fecha_mas_reciente <= scenario.hoy).toBe(true);
      if (item.publicado_hasta !== undefined) expect(item.publicado_hasta > scenario.hoy).toBe(true);
    }
    // Indicators do not share one date: that is why they are reported one by one.
    expect(new Set(state.indicadores.map((item) => item.fecha_mas_reciente)).size).toBeGreaterThan(1);
    expect(state.indicadores.some((item) => item.publicado_hasta !== undefined)).toBe(true);
  });

  test("indicators the DOF stopped publishing are listed apart", async () => {
    const fetch = fixtureFetch();
    const freshness = new Freshness(new DofClient({ fetch }), { now: clockAt(scenario.hoy) });
    const state = await freshness.latestIndicators();
    const silent = state.sin_valores_recientes;
    for (const key of silent) expect(state.indicadores.some((item) => item.indicador === key)).toBe(false);
    expect(silent.length + state.indicadores.length).toBe(fetch.calls.length);
  });

  test("an outage on one indicator fails the whole answer", async () => {
    const fixtures = fixtureFetch();
    const target = entry(`indicadores_rango_${scenario.indicador_adelantado}`).url;
    const fetch: FetchLike = (url) => (url === target ? alwaysFetch("notas_fecha_imposible")(url) : fixtures(url));
    const freshness = new Freshness(new DofClient({ fetch }), { now: clockAt(scenario.hoy) });
    expect(await kindOf(freshness.latestIndicators())).toBe("source_down");
  });

  test("the window is anchored on today", async () => {
    expect(addDays(scenario.indicadores_desde, 1) < scenario.hoy).toBe(true);
    expect(scenario.indicadores_hasta > scenario.hoy).toBe(true);
  });
});
