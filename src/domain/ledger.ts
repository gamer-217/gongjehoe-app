// 원장 — 잔액은 원장 합계로만(§5.2-1), 원장은 추가만(§5.2-2). BR-05·07
import type { ISODate, LedgerEntry, YM } from './types';
import { daysInYear, dayOfYear, monthEnd, ymIndex, ymOf, yearOf } from './dates';

export interface Balance {
  worker: number;
  employer: number;
  dividend: number;
  /** 지급·이체·조정(음수 포함) */
  other: number;
  total: number;
}

export function balance(entries: LedgerEntry[], asOf?: ISODate): Balance {
  const b: Balance = { worker: 0, employer: 0, dividend: 0, other: 0, total: 0 };
  for (const e of entries) {
    if (asOf && e.posted_at > asOf) continue;
    if (!Number.isInteger(e.amount)) throw new Error(`ledger amount must be integer: ${e.entry_id}`);
    if (e.kind === 'WORKER') b.worker += e.amount;
    else if (e.kind === 'EMPLOYER') b.employer += e.amount;
    else if (e.kind === 'DIVIDEND') b.dividend += e.amount;
    else b.other += e.amount;
    b.total += e.amount;
  }
  return b;
}

/** 해당 년월 말일 기준 잔액 */
export const balanceAtMonthEnd = (entries: LedgerEntry[], ym: YM) => balance(entries, monthEnd(ym)).total;

/** 연 평균 잔액 = 1~12월 말일 잔액의 평균(가입 전 달은 0) */
export function averageBalance(entries: LedgerEntry[], year: number, lastMonth = 12): number {
  let sum = 0;
  for (let m = 1; m <= lastMonth; m++) sum += balanceAtMonthEnd(entries, `${year}-${String(m).padStart(2, '0')}`);
  return sum / lastMonth;
}

/**
 * BR-05: 연 1회 확정 배당. 한 근로자의 원장으로 그해 배당 기입 1건(0원이면 없음)을 만든다.
 * 배당 = 연 평균 잔액 × 배당률, 원 미만 버림. 기입일 = 선언일, ym = 그해 12월.
 */
export function declareDividend(
  entries: LedgerEntry[],
  year: number,
  rate: number,
  declaredAt: ISODate,
  makeId: (memberId: string) => string = (m) => `DIV-${year}-${m}`,
): LedgerEntry[] {
  if (entries.length === 0) return [];
  const memberId = entries[0].member_id;
  const amount = Math.floor(averageBalance(entries, year) * rate);
  if (amount <= 0) return [];
  return [
    {
      entry_id: makeId(memberId),
      member_id: memberId,
      posted_at: declaredAt,
      ym: `${year}-12`,
      kind: 'DIVIDEND',
      amount,
      ref_type: 'DIVIDEND',
      ref_id: String(year),
    },
  ];
}

/**
 * BR-07: 연중 지급 시 일할 배당.
 * = (그해 1월부터 지급 전달까지 월말 잔액 평균, 1월 지급이면 현재 잔액) × 직전 선언률 × 경과일/연일수
 */
export function proRataDividend(entries: LedgerEntry[], asOf: ISODate, rate: number): number {
  const year = yearOf(asOf);
  const lastFullMonth = ymIndex(ymOf(asOf)) - ymIndex(`${year}-01`);
  const avg = lastFullMonth >= 1 ? averageBalance(entries, year, lastFullMonth) : balance(entries, asOf).total;
  return Math.floor(avg * rate * (dayOfYear(asOf) / daysInYear(year)));
}

/** 월별 행(내역 화면) — 년월별 근로자·사업주·배당 합과 누적 */
export interface MonthRow {
  ym: YM;
  worker: number;
  employer: number;
  dividend: number;
  other: number;
  cumulative: number;
}

export function monthlyRows(entries: LedgerEntry[], asOf?: ISODate): MonthRow[] {
  const visible = entries.filter((e) => !asOf || e.posted_at <= asOf);
  if (visible.length === 0) return [];
  const byYm = new Map<YM, MonthRow>();
  for (const e of visible) {
    const r = byYm.get(e.ym) ?? { ym: e.ym, worker: 0, employer: 0, dividend: 0, other: 0, cumulative: 0 };
    if (e.kind === 'WORKER') r.worker += e.amount;
    else if (e.kind === 'EMPLOYER') r.employer += e.amount;
    else if (e.kind === 'DIVIDEND') r.dividend += e.amount;
    else r.other += e.amount;
    byYm.set(e.ym, r);
  }
  const sorted = [...byYm.values()].sort((a, b) => ymIndex(a.ym) - ymIndex(b.ym));
  let cum = 0;
  for (const r of sorted) {
    cum += r.worker + r.employer + r.dividend + r.other;
    r.cumulative = cum;
  }
  return sorted;
}

