// 화면용 파생값 — 모두 도메인 함수로 원장에서 계산(§5.2-1)
import {
  balance, clock, hasOpenClaim, maturityProgress, npsApplicable, payStateOf, policy, rateStepFor,
  type ContributionBill, type PayState,
} from '../domain';
import type { MemberView } from './repository';

export interface AccountSummary {
  total: number;
  worker: number;
  employer: number;
  dividend: number;
  seq: number;
  maturity: ReturnType<typeof maturityProgress>;
  rateStep: number;
  latestBill: ContributionBill | null;
  latestPayState: PayState | null;
  latestPaidAt: string | null;
  lastWage: number;
  currentEmployer: MemberView['employments'][number] | null;
  nps: boolean;
  openClaim: MemberView['claims'][number] | null;
  activeAccount: MemberView['bankAccounts'][number] | null;
}

export function summarize(v: MemberView): AccountSummary {
  const today = clock.today();
  const b = balance(v.ledger, today);
  const bills = [...v.bills].sort((a, c) => (a.ym < c.ym ? -1 : 1));
  const latest = bills.at(-1) ?? null;
  const pay = latest ? v.payments.find((p) => p.bill_id === latest.bill_id) : undefined;
  const seq = latest?.member_month_seq ?? 0;
  const open = v.claims.find((c) => ['SUBMITTED', 'VERIFIED', 'PAYING'].includes(c.status)) ?? null;
  return {
    total: b.total,
    worker: b.worker,
    employer: b.employer,
    dividend: b.dividend,
    seq,
    maturity: maturityProgress(Math.max(seq, 1), policy),
    rateStep: seq ? rateStepFor(seq, policy) : 1,
    latestBill: latest,
    latestPayState: latest ? payStateOf(latest, !!pay, today) : null,
    latestPaidAt: pay?.paid_at ?? null,
    lastWage: latest?.wage_krw ?? 0,
    currentEmployer: v.employments.find((e) => e.end_date === null) ?? v.employments.at(-1) ?? null,
    nps: npsApplicable(v.person.nationality_iso2, policy).applicable,
    openClaim: hasOpenClaim(v.claims) ? open : null,
    activeAccount: v.bankAccounts.find((a) => a.active) ?? null,
  };
}

const HANGUL = /[\uAC00-\uD7A3]/;
/** 표시 이름: 한국어 화면이면 한글 원어 이름, 그 밖에는 로마자(비한국어 화면에 한글 0자, §14.1 P10) */
export const displayName = (v: MemberView, uiLang = 'ko') => (uiLang === 'ko' && HANGUL.test(v.person.name_native) ? v.person.name_native : v.person.name_latin);
export const employerName = (e: { name: string; name_latin: string }, uiLang = 'ko') => (uiLang === 'ko' ? e.name : e.name_latin);
