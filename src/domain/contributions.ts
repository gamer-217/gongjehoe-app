// 부과 계산 — BR-01·02·03·04·21
import type { Policy } from './policy';
import type { ContributionBill, Employment, ISODate, YM } from './types';
import { addMonths, monthDay, ymIndex } from './dates';

/** BR-02·04: 가입 누적 개월(seq)에 맞는 사업주 요율. 만기(58) 이후에도 마지막 단계 유지 */
export function employerRateFor(memberMonthSeq: number, policy: Policy): number {
  if (!Number.isInteger(memberMonthSeq) || memberMonthSeq < 1) throw new Error('memberMonthSeq must be >= 1');
  const steps = policy.params.employer_rate_steps.value;
  let rate = steps[0].rate;
  for (const s of steps) if (memberMonthSeq >= s.from_month) rate = s.rate;
  return rate;
}

/** 요율 단계 번호(1부터) — 화면의 '요율 단계' 표시용 */
export function rateStepFor(memberMonthSeq: number, policy: Policy): number {
  const steps = policy.params.employer_rate_steps.value;
  let idx = 0;
  steps.forEach((s, i) => {
    if (memberMonthSeq >= s.from_month) idx = i;
  });
  return idx + 1;
}

/**
 * BR-03: member_month_seq = 부과가 생긴 서로 다른 년월의 수(공백 달 제외).
 * 같은 달에 고용이 둘이면 seq는 하나. 사업장을 옮겨도 이어진다.
 */
export function assignMonthSeq(billYms: YM[]): Map<YM, number> {
  const distinct = [...new Set(billYms)].sort((a, b) => ymIndex(a) - ymIndex(b));
  return new Map(distinct.map((ym, i) => [ym, i + 1]));
}

/** BR-21: 납부 기한 = 다음 달 n일 */
export function dueDateFor(ym: YM, policy: Policy): ISODate {
  return monthDay(addMonths(ym, 1), policy.params.contribution_due_day.value);
}

export interface BillAmounts {
  worker_rate: number;
  employer_rate: number;
  worker_amt: number;
  employer_amt: number;
}

/** BR-01·02·19: 한 달 부과액. 원 미만 버림 */
export function billFor(_employment: Pick<Employment, 'employment_id'>, wage: number, memberMonthSeq: number, policy: Policy): BillAmounts {
  if (!Number.isInteger(wage) || wage < 0) throw new Error('wage must be a non-negative integer (KRW)');
  const worker_rate = policy.params.worker_rate.value;
  const employer_rate = employerRateFor(memberMonthSeq, policy);
  return {
    worker_rate,
    employer_rate,
    worker_amt: Math.floor(wage * worker_rate + 1e-9),
    employer_amt: Math.floor(wage * employer_rate + 1e-9),
  };
}

/** 한 BILL의 화면 상태 — 홈 '이번 달 납입' (§8.2 W-10, §5.2-3) */
export type PayState = 'PAID' | 'PENDING' | 'OVERDUE';
export function payStateOf(bill: Pick<ContributionBill, 'due_date'>, paid: boolean, today: ISODate): PayState {
  if (paid) return 'PAID';
  return today > bill.due_date ? 'OVERDUE' : 'PENDING';
}

/** BR-04: 만기 진행 */
export function maturityProgress(memberMonthSeq: number, policy: Policy) {
  const m = policy.params.maturity_months.value;
  return {
    months: memberMonthSeq,
    maturity: m,
    ratio: Math.min(memberMonthSeq / m, 1),
    matured: memberMonthSeq >= m,
    overMonths: Math.max(memberMonthSeq - m, 0),
  };
}
