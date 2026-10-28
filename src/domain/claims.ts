// 신청 상태 전이 — §6.1·6.2, BR-07·09·10·12
import type { Policy } from './policy';
import type { Actor, Claim, ClaimAction, ClaimEvent, ClaimStatus, ISODate, LedgerEntry, MemberStatus, RejectReason } from './types';
import { addDays } from './dates';
import { balance, proRataDividend } from './ledger';

interface Rule {
  from: ClaimStatus;
  to: ClaimStatus;
  actors: Actor[];
}

/** 전이표. DEATH·CONVERSION도 같은 표를 쓴다(화면은 이번 범위 밖) */
export const TRANSITIONS: Record<ClaimAction, Rule[]> = {
  SUBMIT: [{ from: 'DRAFT', to: 'SUBMITTED', actors: ['WORKER'] }],
  CANCEL: [{ from: 'SUBMITTED', to: 'CANCELLED', actors: ['WORKER'] }],
  VERIFY: [{ from: 'SUBMITTED', to: 'VERIFIED', actors: ['SYSTEM', 'ADMIN'] }],
  APPROVE: [{ from: 'VERIFIED', to: 'PAYING', actors: ['ADMIN'] }],
  PAY: [{ from: 'PAYING', to: 'PAID', actors: ['SYSTEM', 'ADMIN'] }],
  REJECT: [
    { from: 'SUBMITTED', to: 'REJECTED', actors: ['ADMIN'] },
    { from: 'VERIFIED', to: 'REJECTED', actors: ['ADMIN'] },
  ],
};

export type TransitionResult =
  | { ok: true; claim: Claim; event: Omit<ClaimEvent, 'id'> }
  | { ok: false; error: 'INVALID_TRANSITION' | 'ACTOR_NOT_ALLOWED' | 'REASON_REQUIRED' };

export function claimTransition(claim: Claim, action: ClaimAction, actor: Actor, at: ISODate, reason?: RejectReason): TransitionResult {
  const rule = TRANSITIONS[action].find((r) => r.from === claim.status);
  if (!rule) return { ok: false, error: 'INVALID_TRANSITION' };
  if (!rule.actors.includes(actor)) return { ok: false, error: 'ACTOR_NOT_ALLOWED' };
  if (action === 'REJECT' && !reason) return { ok: false, error: 'REASON_REQUIRED' };
  return {
    ok: true,
    claim: { ...claim, status: rule.to, reject_reason: action === 'REJECT' ? reason! : claim.reject_reason },
    event: { claim_id: claim.claim_id, from_status: claim.status, to_status: rule.to, at, actor },
  };
}

/** 현재 상태에서 가능한 행동 */
export function availableActions(status: ClaimStatus, actor: Actor): ClaimAction[] {
  return (Object.keys(TRANSITIONS) as ClaimAction[]).filter((a) =>
    TRANSITIONS[a].some((r) => r.from === status && r.actors.includes(actor)),
  );
}

/** BR-10 */
export const canCancel = (status: ClaimStatus) => status === 'SUBMITTED';

/** 두 상태의 연결(§6.2) — 신청 상태가 바뀐 뒤 가입 상태 */
export function memberStatusAfter(claimStatus: ClaimStatus, current: MemberStatus): MemberStatus {
  switch (claimStatus) {
    case 'SUBMITTED':
    case 'VERIFIED':
    case 'PAYING':
      return 'DEPARTING';
    case 'CANCELLED':
    case 'REJECTED':
      return 'ACTIVE';
    case 'PAID':
      return 'CLOSED';
    default:
      return current;
  }
}

/** BR-09: 출국 예정일은 기준일 ~ 기준일+30일 */
export function departureWindow(today: ISODate, policy: Policy): { min: ISODate; max: ISODate } {
  return { min: today, max: addDays(today, policy.params.claim_window_days.value) };
}
export function isDepartureDateAllowed(departure: ISODate, today: ISODate, policy: Policy): boolean {
  const w = departureWindow(today, policy);
  return departure >= w.min && departure <= w.max;
}

/** 이미 진행 중인 신청이 있으면 새로 낼 수 없다 */
export const OPEN_STATUSES: ClaimStatus[] = ['SUBMITTED', 'VERIFIED', 'PAYING'];
export const hasOpenClaim = (claims: Claim[]) => claims.some((c) => OPEN_STATUSES.includes(c.status));

/** BR-12: 추가 승인이 필요한 행동 */
export type SecureAction = 'CLAIM_SUBMIT' | 'BANK_ACCOUNT_SAVE' | 'NOMINEE_SAVE';
const SECURE: ReadonlySet<string> = new Set<SecureAction>(['CLAIM_SUBMIT', 'BANK_ACCOUNT_SAVE', 'NOMINEE_SAVE']);
export const requiresSecureConfirm = (action: string) => SECURE.has(action);

/**
 * BR-07: 지급(PAID) 시 원장 기입. 직전 선언률로 그해 일할 배당 → 잔액 전부 PAYOUT(음수) → 잔액 0
 */
export function settlementEntries(entries: LedgerEntry[], claim: Claim, at: ISODate, lastDeclaredRate: number): LedgerEntry[] {
  const memberId = claim.member_id;
  const ym = at.slice(0, 7);
  const out: LedgerEntry[] = [];
  const div = proRataDividend(entries, at, lastDeclaredRate);
  if (div > 0) {
    out.push({ entry_id: `DIVP-${claim.claim_id}`, member_id: memberId, posted_at: at, ym, kind: 'DIVIDEND', amount: div, ref_type: 'CLAIM', ref_id: claim.claim_id });
  }
  const total = balance([...entries, ...out], at).total;
  out.push({ entry_id: `PAY-${claim.claim_id}`, member_id: memberId, posted_at: at, ym, kind: 'PAYOUT', amount: -total, ref_type: 'CLAIM', ref_id: claim.claim_id });
  return out;
}
