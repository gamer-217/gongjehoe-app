// 국민연금 비교 — BR-15·16·17
import type { Policy } from './policy';
import type { YM } from './types';
import { yearOf } from './dates';

export function npsApplicable(nationalityIso2: string, policy: Policy): { applicable: boolean; verified: boolean } {
  const c = policy.nps.countries[nationalityIso2];
  if (!c) return { applicable: false, verified: false };
  return { applicable: c.applicable, verified: c.verified };
}

/**
 * BR-23(B안): 공제회 적립 트랙은 국민연금 적용 제외국 근로자만.
 * FUND = 공제회 가입, NPS = 국민연금 반환일시금 그대로(앱은 안내), UNKNOWN = 국가표에 없음(가입 보류)
 */
export type Track = 'FUND' | 'NPS' | 'UNKNOWN';
export function trackFor(nationalityIso2: string, policy: Policy): Track {
  const c = policy.nps.countries[nationalityIso2];
  if (!c) return 'UNKNOWN';
  return c.applicable ? 'NPS' : 'FUND';
}

export function npsTotalRate(year: number, policy: Policy): number {
  const table = policy.params.nps_total_rate_by_year.value;
  const years = Object.keys(table).map(Number).sort((a, b) => a - b);
  const y = Math.min(Math.max(year, years[0]), years[years.length - 1]);
  return table[String(y)];
}

/** BR-15: 사용자 부담률 = 보험료율의 절반 */
export const npsEmployerRate = (year: number, policy: Policy) => npsTotalRate(year, policy) / 2;

export interface NpsLumpSum {
  applicable: boolean;
  principal: number;
  interest: number;
  total: number;
  interestIncluded: boolean;
}

/**
 * BR-16: 반환일시금 약식 예시. 원금 = Σ 월 보수 × 그해 보험료율(노사 합).
 * 이자율이 1차 출처로 확인되지 않았으면(verified=false) 이자를 빼고 원금만 낸다(§14.2-3).
 */
export function npsLumpSumEstimate(member: { nationality_iso2: string; wages: { ym: YM; wage: number }[] }, policy: Policy): NpsLumpSum {
  const { applicable } = npsApplicable(member.nationality_iso2, policy);
  if (!applicable) return { applicable: false, principal: 0, interest: 0, total: 0, interestIncluded: false };
  const principal = member.wages.reduce((s, w) => s + Math.floor(w.wage * npsTotalRate(yearOf(w.ym), policy)), 0);
  const p = policy.params.nps_lump_sum_interest;
  const interestIncluded = p.verified;
  const years = member.wages.length / 12;
  const interest = interestIncluded ? Math.floor(principal * p.value * (years / 2)) : 0;
  return { applicable: true, principal, interest, total: principal + interest, interestIncluded };
}
