/**
 * The API reports failures in several ways (HTTP status, `messageCode` in
 * the body, HTML error pages, an empty object), so nothing here trusts the
 * status alone or calls `.json()` on a body it has not looked at.
 */
import type * as z from "zod/v4";
import { DOF_BASE_URL, MAX_CONCURRENT_REQUESTS, TIMEOUT_MS } from "./constants.ts";
import { isoToDof, type IsoDate } from "./dates.ts";
import {
  EditionByTypeResponse,
  EditionsByDateResponse,
  IndicatorCatalogResponse,
  IndicatorsResponse,
  NoteDetailResponse,
  NotesByDateResponse,
  TitleSearchResponse,
} from "./schemas.ts";

export type DofErrorKind =
  | "no_data"
  | "route_missing"
  | "invalid_input"
  | "source_down"
  | "timeout"
  | "unexpected_response";

export class DofError extends Error {
  override readonly name = "DofError";
  constructor(
    readonly kind: DofErrorKind,
    message: string,
    readonly url: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<Response>;

export interface RequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface DofResult<T> {
  url: string;
  data: T;
}

export type EditionCode = "MAT" | "VES" | "EXT";

export interface DofClientOptions {
  fetch?: FetchLike;
  baseUrl?: string;
  maxConcurrent?: number;
}

class Semaphore {
  private active = 0;
  private readonly waiting: (() => void)[] = [];

  constructor(private readonly limit: number) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    // A finishing task hands its slot to the next waiter, so the count never exceeds the limit.
    if (this.active >= this.limit) await new Promise<void>((resolve) => this.waiting.push(resolve));
    else this.active++;
    try {
      return await task();
    } finally {
      const next = this.waiting.shift();
      if (next) next();
      else this.active--;
    }
  }
}

function describeIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 3)
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
}

export class DofClient {
  private readonly fetch: FetchLike;
  private readonly baseUrl: string;
  private readonly semaphore: Semaphore;

  constructor(options: DofClientOptions = {}) {
    this.fetch = options.fetch ?? ((url, init) => fetch(url, init));
    this.baseUrl = options.baseUrl ?? DOF_BASE_URL;
    this.semaphore = new Semaphore(options.maxConcurrent ?? MAX_CONCURRENT_REQUESTS);
  }

  notesByDate(date: IsoDate, options?: RequestOptions): Promise<DofResult<NotesByDateResponse>> {
    return this.get(`/notas/${isoToDof(date)}`, NotesByDateResponse, options);
  }

  noteDetail(codNota: number, options?: RequestOptions): Promise<DofResult<NoteDetailResponse>> {
    return this.get(`/notas/nota/${codNota}`, NoteDetailResponse, { timeoutMs: TIMEOUT_MS.noteDetail, ...options });
  }

  editionsByDate(date: IsoDate, options?: RequestOptions): Promise<DofResult<EditionsByDateResponse>> {
    return this.get(`/diarios/porFecha/${isoToDof(date)}`, EditionsByDateResponse, options);
  }

  editionByType(date: IsoDate, edition: EditionCode, options?: RequestOptions): Promise<DofResult<EditionByTypeResponse>> {
    return this.get(`/diarios/obtieneDiario/${isoToDof(date)}/${edition}`, EditionByTypeResponse, options);
  }

  indicatorsByDate(date: IsoDate, options?: RequestOptions): Promise<DofResult<IndicatorsResponse>> {
    return this.get(`/indicadores/${isoToDof(date)}`, IndicatorsResponse, options);
  }

  /** Both ends are included. */
  indicatorRange(code: number, from: IsoDate, to: IsoDate, options?: RequestOptions): Promise<DofResult<IndicatorsResponse>> {
    return this.get(`/indicadores/${code}/${isoToDof(from)}/${isoToDof(to)}`, IndicatorsResponse, {
      timeoutMs: TIMEOUT_MS.indicatorRange,
      ...options,
    });
  }

  /** Undocumented route. */
  indicatorCatalog(options?: RequestOptions): Promise<DofResult<IndicatorCatalogResponse>> {
    return this.get("/catalogos/cat_tipos_indicadores", IndicatorCatalogResponse, options);
  }

  /**
   * Undocumented route. Pages start at 1. The text travels in the path, so
   * characters that would change the route are replaced by spaces.
   */
  searchTitles(
    text: string,
    page: number,
    size: number,
    order: "asc" | "desc",
    options?: RequestOptions,
  ): Promise<DofResult<TitleSearchResponse>> {
    const safe = text.replace(/[/\\;%]+/g, " ").replace(/\s+/g, " ").trim();
    return this.get(`/buscarNotas/titulo/${encodeURIComponent(safe)}/${page}/${size}/fecha/${order}`, TitleSearchResponse, {
      timeoutMs: TIMEOUT_MS.noteDetail,
      ...options,
    });
  }

  private async get<T>(path: string, schema: z.ZodType<T>, options: RequestOptions = {}): Promise<DofResult<T>> {
    const url = `${this.baseUrl}${path}`;
    const timeoutMs = options.timeoutMs ?? TIMEOUT_MS.default;
    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;

    let status: number;
    let text: string;
    try {
      [status, text] = await this.semaphore.run(async () => {
        const response = await this.fetch(url, { signal });
        return [response.status, await response.text()] as const;
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new DofError("timeout", `The DOF did not respond within ${timeoutMs / 1000} seconds (${url}). Try again later.`, url);
      }
      // The caller cancelled: not a DOF failure.
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      throw new DofError("source_down", `Could not connect to the DOF service (${url}). Try again later.`, url);
    }

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = undefined;
    }
    const envelope = typeof body === "object" && body !== null ? (body as { messageCode?: unknown; response?: unknown }) : {};
    const messageCode = typeof envelope.messageCode === "number" ? envelope.messageCode : undefined;
    const failure = status !== 200 ? status : messageCode !== undefined && messageCode !== 200 ? messageCode : undefined;

    if (failure === 404) {
      if (envelope.response === "NOT_FOUND") {
        throw new DofError("no_data", `The DOF has no data for this query (${url}).`, url, status);
      }
      throw new DofError(
        "route_missing",
        `The DOF service no longer recognises the route ${url}. This does not depend on the query: the server needs an update.`,
        url,
        status,
      );
    }
    if (failure === 400) {
      throw new DofError("invalid_input", `The DOF rejected the query parameters (${url}).`, url, status);
    }
    if (failure !== undefined) {
      throw new DofError(
        failure >= 500 ? "source_down" : "unexpected_response",
        `The DOF service answered with error ${failure} (${url}). Try again later.`,
        url,
        status,
      );
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const detail = body === undefined ? "the body is not JSON" : describeIssues(parsed.error);
      throw new DofError("unexpected_response", `The DOF answered in a format other than the expected one (${url}): ${detail}.`, url, status);
    }
    return { url, data: parsed.data };
  }
}
