import { describe, expect, test } from 'vitest';
import {
  availableActions, balance, canCancel, claimTransition, departureWindow, isDepartureDateAllowed,
  memberStatusAfter, policy, requiresSecureConfirm, settlementEntries, type Claim, type ClaimStatus,
} from '../../src/domain';
import { entry } from './helpers';

const base: Claim = {
  claim_id: 'C1', member_id: 'M1', type: 'DEPARTURE', status: 'DRAFT', departure_date: '2026-11-01',
  amount_snapshot: 0, bank_account_id: 'BA1', created_at: '2026-10-15', reject_reason: null,
};
const at = '2026-10-15';

describe('§6.2 신청 상태 전이', () => {
  test('정상 흐름 DRAFT→SUBMITTED→VERIFIED→PAYING→PAID', () => {
    let c = base;
    for (const [action, actor, to] of [
      ['SUBMIT', 'WORKER', 'SUBMITTED'], ['VERIFY', 'SYSTEM', 'VERIFIED'], ['APPROVE', 'ADMIN', 'PAYING'], ['PAY', 'SYSTEM', 'PAID'],
    ] as const) {
      const r = claimTransition(c, action, actor, at);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.claim.status).toBe(to);
        expect(r.event.from_status).toBe(c.status);
        c = r.claim;
      }
    }
  });
  test('건너뛰기 불가(SUBMITTED에서 PAY)', () => {
    const r = claimTransition({ ...base, status: 'SUBMITTED' }, 'PAY', 'SYSTEM', at);
    expect(r).toEqual({ ok: false, error: 'INVALID_TRANSITION' });
  });
  test('근로자는 승인할 수 없다', () => {
    expect(claimTransition({ ...base, status: 'VERIFIED' }, 'APPROVE', 'WORKER', at)).toEqual({ ok: false, error: 'ACTOR_NOT_ALLOWED' });
  });
  test('반려는 사유 코드 필수', () => {
    expect(claimTransition({ ...base, status: 'SUBMITTED' }, 'REJECT', 'ADMIN', at)).toEqual({ ok: false, error: 'REASON_REQUIRED' });
    const r = claimTransition({ ...base, status: 'VERIFIED' }, 'REJECT', 'ADMIN', at, 'NO_DEPARTURE_RECORD');
    expect(r.ok && r.claim.reject_reason).toBe('NO_DEPARTURE_RECORD');
  });
  test.each<[ClaimStatus]>([['PAID'], ['CANCELLED'], ['REJECTED']])('종결 상태 %s에서는 어떤 행동도 없다', (s) => {
    expect(availableActions(s, 'ADMIN')).toEqual([]);
    expect(availableActions(s, 'WORKER')).toEqual([]);
  });
});

describe('BR-10 취소는 접수 상태에서만', () => {
  test.each<[ClaimStatus, boolean]>([
    ['DRAFT', false], ['SUBMITTED', true], ['VERIFIED', false], ['PAYING', false], ['PAID', false], ['CANCELLED', false], ['REJECTED', false],
  ])('%s → %s', (s, ok) => {
    expect(canCancel(s)).toBe(ok);
    expect(claimTransition({ ...base, status: s }, 'CANCEL', 'WORKER', at).ok).toBe(ok);
  });
});

describe('§6.1 가입 상태 연결', () => {
  test.each<[ClaimStatus, string]>([
    ['SUBMITTED', 'DEPARTING'], ['VERIFIED', 'DEPARTING'], ['PAYING', 'DEPARTING'],
    ['CANCELLED', 'ACTIVE'], ['REJECTED', 'ACTIVE'], ['PAID', 'CLOSED'], ['DRAFT', 'ACTIVE'],
  ])('신청 %s → 가입 %s', (s, m) => {
    expect(memberStatusAfter(s, 'ACTIVE')).toBe(m);
  });
});

describe('BR-09 출국 예정일 30일 이내', () => {
  test('범위', () => {
    expect(departureWindow('2026-10-15', policy)).toEqual({ min: '2026-10-15', max: '2026-11-14' });
  });
  test.each([
    ['2026-10-14', false], ['2026-10-15', true], ['2026-11-14', true], ['2026-11-15', false],
  ])('%s → %s', (d, ok) => {
    expect(isDepartureDateAllowed(d, '2026-10-15', policy)).toBe(ok);
  });
});

describe('BR-12 보안 확인 대상', () => {
  test.each([['CLAIM_SUBMIT', true], ['BANK_ACCOUNT_SAVE', true], ['NOMINEE_SAVE', true], ['LANG_CHANGE', false]])('%s → %s', (a, ok) => {
    expect(requiresSecureConfirm(a)).toBe(ok);
  });
});

describe('BR-07 지급 시 잔액 전부 + 일할 배당 → 잔액 0', () => {
  const es = [
    entry({ posted_at: '2025-12-10', kind: 'WORKER', amount: 600_000 }),
    entry({ posted_at: '2025-12-10', kind: 'EMPLOYER', amount: 400_000 }),
  ];
  const claim = { ...base, status: 'PAID' as const };
  test('배당 기입 후 PAYOUT 음수로 잔액 0', () => {
    const add = settlementEntries(es, claim, '2026-10-20', 0.03);
    expect(add.map((e) => e.kind)).toEqual(['DIVIDEND', 'PAYOUT']);
    expect(add[0].amount).toBeGreaterThan(0);
    expect(add[1].amount).toBe(-(1_000_000 + add[0].amount));
    expect(balance([...es, ...add]).total).toBe(0);
  });
});
