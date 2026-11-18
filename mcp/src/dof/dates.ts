import { DOF_TIME_ZONE } from "./constants.ts";

export type IsoDate = string;

const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DOF_PATTERN = /^(\d{2})-(\d{2})-(\d{4})$/;
const DAY_MS = 86_400_000;

function isRealDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isIsoDate(value: string): value is IsoDate {
  const match = ISO_PATTERN.exec(value);
  return match !== null && isRealDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

/**
 * The DOF is not safe with anything but zero-padded `DD-MM-YYYY`: depending
 * on the route it rejects other forms, answers 500 to an impossible date, or
 * reads a two-digit year.
 */
export function isoToDof(iso: IsoDate): string {
  if (!isIsoDate(iso)) throw new RangeError(`Not a valid YYYY-MM-DD date: ${iso}`);
  return `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}`;
}

export function dofToIso(dof: string): IsoDate | undefined {
  const match = DOF_PATTERN.exec(dof);
  if (match === null) return undefined;
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return isRealDate(year, month, day) ? `${match[3]}-${match[2]}-${match[1]}` : undefined;
}

export function todayInMexicoCity(now: Date): IsoDate {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DOF_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toUtc(iso: IsoDate): number {
  return Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  return new Date(toUtc(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

export function eachDate(from: IsoDate, to: IsoDate): IsoDate[] {
  const dates: IsoDate[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) dates.push(date);
  return dates;
}
