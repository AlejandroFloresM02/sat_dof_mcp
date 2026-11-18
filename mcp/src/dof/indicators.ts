/**
 * The DOF serves the names (`/catalogos/cat_tipos_indicadores`, an
 * undocumented route) but no units, so the table lives here. A test compares
 * it with the captured catalog and fails when the DOF adds a code.
 */
export interface IndicatorInfo {
  code: number;
  key: string;
  catalogName: string;
  name: string;
  unit: string;
}

const PERCENT = "porcentaje anual";

export const INDICATORS: readonly IndicatorInfo[] = [
  { code: 158, key: "dolar_fix", catalogName: "DÓLAR", name: "Tipo de cambio del dólar (FIX)", unit: "pesos por dólar" },
  { code: 159, key: "udi", catalogName: "UDIS", name: "Valor de la UDI", unit: "pesos por UDI" },
  { code: 160, key: "ccp", catalogName: "CCP", name: "Costo de captación a plazo (CCP)", unit: PERCENT },
  { code: 161, key: "ccp_udis", catalogName: "CCP-UDIS", name: "Costo de captación a plazo en UDIS (CCP-UDIS)", unit: PERCENT },
  { code: 162, key: "cpp", catalogName: "CPP", name: "Costo porcentual promedio de captación (CPP)", unit: PERCENT },
  { code: 163, key: "ccp_dolares", catalogName: "CCP-DÓLARES", name: "Costo de captación a plazo en dólares (CCP-Dólares)", unit: PERCENT },
  { code: 165, key: "tiie_28", catalogName: "TIIE 28 DÍAS", name: "TIIE a 28 días", unit: PERCENT },
  { code: 166, key: "tiie_91", catalogName: "TIIE 91 DÍAS", name: "TIIE a 91 días", unit: PERCENT },
  { code: 174, key: "tiie_182", catalogName: "TIIE 182 DÍAS", name: "TIIE a 182 días", unit: PERCENT },
  { code: 175, key: "tiie_fondeo", catalogName: "TIIE DE FONDEO", name: "TIIE de fondeo a un día", unit: PERCENT },
  { code: 176, key: "tiie_90", catalogName: "TIIE 90 DIAS", name: "TIIE a 90 días", unit: PERCENT },
  { code: 177, key: "tiie_29", catalogName: "TIIE 29 DIAS", name: "TIIE a 29 días", unit: PERCENT },
  { code: 178, key: "tiie_27", catalogName: "TIIE 27 DIAS", name: "TIIE a 27 días", unit: PERCENT },
  { code: 179, key: "tiie_26", catalogName: "TIIE 26 DIAS", name: "TIIE a 26 días", unit: PERCENT },
  { code: 180, key: "tiie_181", catalogName: "TIIE 181 DÍAS", name: "TIIE a 181 días", unit: PERCENT },
  { code: 181, key: "tiie_92", catalogName: "TIIE 92 DIAS", name: "TIIE a 92 días", unit: PERCENT },
  { code: 182, key: "tiie_89", catalogName: "TIIE 89 DIAS", name: "TIIE a 89 días", unit: PERCENT },
];

export const INDICATOR_KEYS = INDICATORS.map((indicator) => indicator.key) as [string, ...string[]];

const BY_CODE = new Map(INDICATORS.map((indicator) => [indicator.code, indicator]));
const BY_KEY = new Map(INDICATORS.map((indicator) => [indicator.key, indicator]));

export function indicatorByCode(code: number): IndicatorInfo | undefined {
  return BY_CODE.get(code);
}

export function indicatorByKey(key: string): IndicatorInfo | undefined {
  return BY_KEY.get(key);
}
