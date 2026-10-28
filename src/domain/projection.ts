// 미래 잔액 예시 — 원장 밖 계산은 여기만(§5.2-1). 결과는 항상 '예시' 라벨과 함께 표시(BR-06)
import type { Policy } from './policy';
import type { YM } from './types';
import { billFor } from './contributions';
import { addMonths } from './dates';

export interface ProjectionInput {
  confirmedTotal: number;
  lastWage: number;
  lastSeq: number;
  lastYm: YM;
}

export interface Projection {
  monthsAhead: number;
  untilYm: YM;
  seqAtEnd: number;
  confirmed: number;
  /** 앞으로 들어올 근로자+사업주 기여(같은 월급 가정) */
  futureContributions: number;
  /** 가정 수익률로 붙을 수 있는 수익(확정 아님) */
  assumedReturn: number;
  total: number;
}

export function project(input: ProjectionInput, monthsAhead: number, policy: Policy, assumedRate = policy.params.projection_rate.value): Projection {
  if (!Number.isInteger(monthsAhead) || monthsAhead < 0) throw new Error('monthsAhead must be a non-negative integer');
  const r = assumedRate / 12;
  let bal = input.confirmedTotal;
  let contributions = 0;
  for (let i = 1; i <= monthsAhead; i++) {
    const b = billFor({ employment_id: 'projection' }, input.lastWage, input.lastSeq + i, policy);
    const c = b.worker_amt + b.employer_amt;
    contributions += c;
    bal = (bal + c) * (1 + r);
  }
  const total = Math.floor(bal);
  return {
    monthsAhead,
    untilYm: addMonths(input.lastYm, monthsAhead),
    seqAtEnd: input.lastSeq + monthsAhead,
    confirmed: input.confirmedTotal,
    futureContributions: contributions,
    assumedReturn: total - input.confirmedTotal - contributions,
    total,
  };
}

/** W-30 칩: 지금 / 6개월 뒤 / 1년 뒤 / 만기. 이미 만기를 지났으면 만기 칩 없음 */
export function horizonChips(lastSeq: number, policy: Policy): { key: 'now' | 'm6' | 'm12' | 'maturity'; months: number }[] {
  const chips: { key: 'now' | 'm6' | 'm12' | 'maturity'; months: number }[] = [
    { key: 'now', months: 0 },
    { key: 'm6', months: 6 },
    { key: 'm12', months: 12 },
  ];
  const toMaturity = policy.params.maturity_months.value - lastSeq;
  if (toMaturity > 0) chips.push({ key: 'maturity', months: toMaturity });
  return chips;
}
