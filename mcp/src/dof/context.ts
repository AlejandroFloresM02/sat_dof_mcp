import { DofClient, type FetchLike } from "./client.ts";
import { todayInMexicoCity, type IsoDate } from "./dates.ts";
import { Freshness } from "./freshness.ts";
import { normalizeNotesByDate, type PublicacionesDelDia } from "./normalize.ts";

export interface DayNotes extends PublicacionesDelDia {
  fecha: IsoDate;
  url: string;
}

export interface DofContextOptions {
  fetch?: FetchLike;
  now?: () => Date;
}

/** A past day rarely changes; today can gain an evening edition at any moment. */
const PAST_DAY_TTL_MS = 60 * 60_000;
const TODAY_TTL_MS = 5 * 60_000;
const MAX_CACHED_DAYS = 400;

export class DofContext {
  readonly client: DofClient;
  readonly freshness: Freshness;
  readonly now: () => Date;
  private readonly days = new Map<IsoDate, { expiresAt: number; promise: Promise<DayNotes> }>();

  constructor(options: DofContextOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.client = new DofClient({ fetch: options.fetch });
    this.freshness = new Freshness(this.client, { now: this.now });
  }

  today(): IsoDate {
    return todayInMexicoCity(this.now());
  }

  dayNotes(date: IsoDate): Promise<DayNotes> {
    const nowMs = this.now().getTime();
    const cached = this.days.get(date);
    if (cached !== undefined && cached.expiresAt > nowMs) return cached.promise;

    if (this.days.size >= MAX_CACHED_DAYS) this.days.clear();
    const promise = this.client
      .notesByDate(date)
      .then(({ url, data }) => ({ fecha: date, url, ...normalizeNotesByDate(data) }));
    this.days.set(date, { expiresAt: nowMs + (date < this.today() ? PAST_DAY_TTL_MS : TODAY_TTL_MS), promise });
    promise.catch(() => this.days.delete(date));
    return promise;
  }
}
