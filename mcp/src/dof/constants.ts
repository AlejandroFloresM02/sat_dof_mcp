export const DOF_BASE_URL = "https://sidof.segob.gob.mx/dof/sidof";

/** The `www` host fails certificate validation. */
export const DOF_PUBLIC_NOTE_URL = "https://dof.gob.mx/nota_detalle.php";

export const DOF_TIME_ZONE = "America/Mexico_City";

export const TIMEOUT_MS = {
  default: 30_000,
  /** A list note can weigh megabytes and take over 15 s. */
  noteDetail: 60_000,
  indicatorRange: 90_000,
} as const;

/** 298 requests ran 4 at a time without errors. The DOF documents no limit, so there is no evidence that more is safe. */
export const MAX_CONCURRENT_REQUESTS = 4;

export const CHARACTER_LIMIT = 25_000;

export const LATEST_EDITION_MAX_DAYS = 10;

/** Long enough to reach the last value of a monthly indicator. */
export const INDICATOR_LOOKBACK_DAYS = 62;

/** Some indicators are published ahead of today. */
export const INDICATOR_LOOKAHEAD_DAYS = 31;

export const DISCLAIMER =
  "Información tomada del Diario Oficial de la Federación. No sustituye una revisión fiscal o legal.";
