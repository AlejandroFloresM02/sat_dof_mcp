/**
 * The DOF has no "latest date" route, sends no Last-Modified or ETag, and its
 * Date header differs by minutes between backends. So the latest dates are
 * found by asking, and the time of the query comes from the local clock.
 */
import { DofError, type DofClient } from "./client.ts";
import { INDICATOR_LOOKAHEAD_DAYS, INDICATOR_LOOKBACK_DAYS, LATEST_EDITION_MAX_DAYS } from "./constants.ts";
import { addDays, todayInMexicoCity, type IsoDate } from "./dates.ts";
import { INDICATORS } from "./indicators.ts";
import { normalizeEditions, normalizeIndicators, type Edicion } from "./normalize.ts";

export interface UltimaEdicion {
  fecha: IsoDate;
  ediciones: Edicion[];
  dias_revisados: number;
  hoy_cdmx: IsoDate;
  consultado_en: string;
  url: string;
}

export interface EstadoIndicador {
  codigo: number;
  indicador: string;
  nombre: string;
  unidad: string;
  fecha_mas_reciente: IsoDate;
  valor: number | null;
  valor_original: string;
  publicado_hasta?: IsoDate;
}

export interface EstadoIndicadores {
  indicadores: EstadoIndicador[];
  sin_valores_recientes: string[];
  ventana_desde: IsoDate;
  ventana_hasta: IsoDate;
  consultado_en: string;
}

export interface FreshnessOptions {
  now?: () => Date;
  ttlMs?: number;
  maxDays?: number;
}

interface Memo<T> {
  day: IsoDate;
  expiresAt: number;
  promise: Promise<T>;
}

export class Freshness {
  private readonly now: () => Date;
  private readonly ttlMs: number;
  private readonly maxDays: number;
  private editionMemo?: Memo<UltimaEdicion>;
  private indicatorMemo?: Memo<EstadoIndicadores>;

  constructor(
    private readonly client: DofClient,
    options: FreshnessOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.ttlMs = options.ttlMs ?? 5 * 60_000;
    this.maxDays = options.maxDays ?? LATEST_EDITION_MAX_DAYS;
  }

  reset(): void {
    this.editionMemo = undefined;
    this.indicatorMemo = undefined;
  }

  /**
   * Weekend and holiday editions exist, so no day is skipped. Only the API's
   * own "nothing for this date" moves the walk back a day: any other failure
   * stops it, so an outage is never reported as an older date.
   */
  latestEdition(): Promise<UltimaEdicion> {
    this.editionMemo = this.reuse(this.editionMemo, () => this.findLatestEdition());
    return this.editionMemo.promise;
  }

  latestIndicators(): Promise<EstadoIndicadores> {
    this.indicatorMemo = this.reuse(this.indicatorMemo, () => this.findLatestIndicators());
    return this.indicatorMemo.promise;
  }

  private reuse<T>(memo: Memo<T> | undefined, compute: () => Promise<T>): Memo<T> {
    const now = this.now();
    const day = todayInMexicoCity(now);
    if (memo !== undefined && memo.day === day && memo.expiresAt > now.getTime()) return memo;
    const fresh: Memo<T> = { day, expiresAt: now.getTime() + this.ttlMs, promise: compute() };
    // A failure is not cached.
    fresh.promise.catch(() => {
      fresh.expiresAt = 0;
    });
    return fresh;
  }

  private async findLatestEdition(): Promise<UltimaEdicion> {
    const now = this.now();
    const today = todayInMexicoCity(now);
    for (let back = 0; back < this.maxDays; back++) {
      const date = addDays(today, -back);
      try {
        const { url, data } = await this.client.editionsByDate(date);
        const ediciones = normalizeEditions(data);
        if (ediciones.length > 0) {
          return { fecha: date, ediciones, dias_revisados: back + 1, hoy_cdmx: today, consultado_en: now.toISOString(), url };
        }
      } catch (error) {
        if (!(error instanceof DofError && error.kind === "no_data")) throw error;
      }
    }
    throw new DofError(
      "unexpected_response",
      `The DOF reports no edition in the last ${this.maxDays} days (up to ${today}). The service is probably failing; try again later.`,
      "",
    );
  }

  private async findLatestIndicators(): Promise<EstadoIndicadores> {
    const now = this.now();
    const today = todayInMexicoCity(now);
    const from = addDays(today, -INDICATOR_LOOKBACK_DAYS);
    const to = addDays(today, INDICATOR_LOOKAHEAD_DAYS);

    const perIndicator = await Promise.all(
      INDICATORS.map(async (info) => {
        try {
          const { data } = await this.client.indicatorRange(info.code, from, to);
          return { info, values: normalizeIndicators(data.ListaIndicadores) };
        } catch (error) {
          if (error instanceof DofError && error.kind === "no_data") return { info, values: [] };
          throw error;
        }
      }),
    );

    const indicadores: EstadoIndicador[] = [];
    const sin_valores_recientes: string[] = [];
    for (const { info, values } of perIndicator) {
      const latest = values.findLast((value) => value.fecha <= today);
      const last = values.at(-1);
      if (latest === undefined || last === undefined) {
        sin_valores_recientes.push(info.key);
        continue;
      }
      indicadores.push({
        codigo: info.code,
        indicador: info.key,
        nombre: info.name,
        unidad: info.unit,
        fecha_mas_reciente: latest.fecha,
        valor: latest.valor,
        valor_original: latest.valor_original,
        ...(last.fecha > today ? { publicado_hasta: last.fecha } : {}),
      });
    }
    return { indicadores, sin_valores_recientes, ventana_desde: from, ventana_hasta: to, consultado_en: now.toISOString() };
  }
}
