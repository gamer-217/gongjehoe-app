// A-30 재정 시뮬레이터 — docs/ref_fund-simulator.jsx의 코호트 수입–지출 균형 모형 이식(결정론적)
import fundSim from '../../policy/fund_sim.json' with { type: 'json' };

export type FundParamKey = 'N' | 'D' | 'exitRate' | 'wRate' | 'eRate' | 'govRate' | 'ret' | 'admin' | 'wageM' | 'g';
export type FundParams = Record<FundParamKey, number>;
export const fundSimConfig = fundSim as unknown as {
  label: string;
  source: string;
  years: number;
  params: Record<FundParamKey, { default: number; min: number; max: number; step: number; unit: string }>;
  ocb_points: Record<string, number>;
};

export const defaultFundParams = (): FundParams =>
  Object.fromEntries(Object.entries(fundSimConfig.params).map(([k, v]) => [k, v.default])) as FundParams;

export interface FundRow {
  year: number;
  /** 조원 */
  fund: number;
  /** 억원 */
  net: number;
  refund: number;
  /** 만명 */
  residents: number;
}

export function simulateFund(p: FundParams, years = fundSimConfig.years): { rows: FundRow[]; breakeven: number | null } {
  let cohorts: { entryT: number; size: number; bal: number }[] = [];
  let govBuf = 0;
  let cumAdmin = 0;
  let prevFund = 0;
  let breakeven: number | null = null;
  const rows: FundRow[] = [];
  for (let t = 1; t <= years; t++) {
    const wage = p.wageM * 1e4 * Math.pow(1 + p.g / 100, t - 1);
    const contribPP = (wage * 12 * (p.wRate + p.eRate)) / 100;
    cohorts.forEach((c) => (c.bal *= 1 + p.ret / 100));
    govBuf *= 1 + p.ret / 100;
    cohorts.push({ entryT: t, size: p.N * 1e4, bal: 0 });
    let totalContrib = 0;
    cohorts.forEach((c) => {
      c.bal += contribPP;
      totalContrib += contribPP * c.size;
    });
    const govY = (totalContrib * p.govRate) / 100;
    govBuf += govY;
    let refund = 0;
    cohorts.forEach((c) => {
      if (t - c.entryT + 1 >= p.D) {
        const out = (c.size * p.exitRate) / 100;
        refund += c.bal * out;
        c.size -= out;
      }
    });
    cohorts = cohorts.filter((c) => c.size > 1);
    const adminY = ((totalContrib + govY) * p.admin) / 100;
    cumAdmin += adminY;
    const fund = cohorts.reduce((s, c) => s + c.bal * c.size, 0) + govBuf - cumAdmin;
    const net = fund - prevFund;
    if (breakeven === null && t > 2 && net > 0 && rows.some((r) => r.net < 0)) breakeven = t;
    rows.push({
      year: t,
      fund: +(fund / 1e12).toFixed(2),
      net: Math.round(net / 1e8),
      refund: Math.round(refund / 1e8),
      residents: Math.round(cohorts.reduce((s, c) => s + c.size, 0) / 1e4),
    });
    prevFund = fund;
  }
  return { rows, breakeven };
}

/** 논문 표4 기준선(조원) 선형 보간 */
export function ocbAt(y: number): number {
  const pts = fundSimConfig.ocb_points;
  const keys = Object.keys(pts).map(Number).sort((a, b) => a - b);
  if (pts[String(y)] != null) return pts[String(y)];
  let lo = keys[0];
  let hi = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) if (keys[i] <= y && y <= keys[i + 1]) [lo, hi] = [keys[i], keys[i + 1]];
  const f = (y - lo) / (hi - lo);
  return +(pts[String(lo)] + f * (pts[String(hi)] - pts[String(lo)])).toFixed(2);
}
