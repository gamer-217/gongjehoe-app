import { describe, expect, test } from 'vitest';
import data from '../../fixtures/demo.json' with { type: 'json' };
import { balance, employerRateFor, policy, trackFor, type Dataset } from '../../src/domain';

const ds = data as unknown as Dataset;
const ledgerOf = (m: string) => ds.ledger.filter((e) => e.member_id === m);
const billsOf = (m: string) => ds.bills.filter((b) => b.employment_id.startsWith(m));

describe('§5.3 시연 인물 총액 스냅숏(P4 최초 생성값 고정)', () => {
  // 레거시 v0.5 값(Ramesh 5,723,627원)과 다른 이유는 README 참고: 월복리→연 1회 확정 배당, 고정 월급→연도별 최저임금 인상 반영
  test.each([
    ['W001', 36, 5_436_835],
    ['W002', 18, 2_635_312],
    ['W003', 52, 8_543_842],
    ['W004', 70, 13_511_303],
  ])('%s: %i개월, 총 %i원', (m, months, total) => {
    expect(billsOf(m).at(-1)!.member_month_seq).toBe(months);
    expect(balance(ledgerOf(m)).total).toBe(total);
  });
});

describe('§5.2 원장 무결성', () => {
  test.each(ds.members.map((m) => [m.member_id]))('%s: 수납액 합 = 원장 기여 합', (m) => {
    const bills = new Set(billsOf(m).map((b) => b.bill_id));
    const paid = ds.payments.filter((p) => bills.has(p.bill_id)).reduce((s, p) => s + p.amount, 0);
    const b = balance(ledgerOf(m));
    expect(b.worker + b.employer).toBe(paid);
  });
  test('모든 BILL은 정책 버전과 요율 단계를 기록한다', () => {
    for (const b of ds.bills) {
      expect(b.policy_version_id).toBe(policy.version_id);
      expect(b.employer_rate).toBe(employerRateFor(b.member_month_seq, policy));
    }
  });
  test('BR-03 Nguyen: 사업장 변경 후 seq가 13부터 이어진다', () => {
    const second = ds.bills.filter((b) => b.employment_id === 'W002-E2');
    expect(second[0].ym).toBe('2026-04');
    expect(second[0].member_month_seq).toBe(13);
    expect(ds.bills.some((b) => b.employment_id.startsWith('W002') && b.ym === '2026-03')).toBe(false);
  });
  test('§5.2-3 미납 BILL(Nguyen 2026-09)은 OVERDUE이고 수납·원장이 없다', () => {
    const b = ds.bills.find((x) => x.employment_id === 'W002-E2' && x.ym === '2026-09')!;
    expect(b.status).toBe('OVERDUE');
    expect(ds.payments.some((p) => p.bill_id === b.bill_id)).toBe(false);
    expect(ds.ledger.some((e) => e.ref_id === b.bill_id)).toBe(false);
    expect(ds.notifications.some((n) => n.member_id === 'W002' && n.kind === 'UNPAID')).toBe(true);
  });
  test('BR-03 미납 달도 부과가 있으면 가입 개월에 센다', () => {
    expect(billsOf('W002').at(-1)!.member_month_seq).toBe(18);
  });
  test('§5.2-4 모든 BILL의 정책 버전은 POLICY_VERSION 표에 있다', () => {
    const ids = new Set(ds.policy_versions.map((v) => v.version_id));
    expect(ds.policy_versions.length).toBeGreaterThan(0);
    for (const b of ds.bills) expect(ids.has(b.policy_version_id)).toBe(true);
  });
  test('BR-23 국민연금 적용국(W005 베트남)은 공제회 부과·원장이 없고 보수 신고만 있다', () => {
    expect(billsOf('W005')).toHaveLength(0);
    expect(ledgerOf('W005')).toHaveLength(0);
    const emp = ds.employments.filter((e) => e.member_id === 'W005').map((e) => e.employment_id);
    expect(ds.wage_reports.filter((w) => emp.includes(w.employment_id)).length).toBeGreaterThan(0);
  });
  test('BR-23 공제회 가입자(부과가 있는 사람)는 모두 국민연금 비적용국', () => {
    for (const m of ds.members) {
      const p = ds.persons.find((x) => x.person_id === m.person_id)!;
      if (billsOf(m.member_id).length) expect(trackFor(p.nationality_iso2, policy)).toBe('FUND');
    }
  });
  test('BR-05 배당은 시연용 가정값으로 표시된다', () => {
    expect(ds.dividends.every((d) => d.demo)).toBe(true);
  });
  test('NFR-05 등록번호는 모두 마스킹', () => {
    for (const p of ds.persons) expect(p.rid_masked).toMatch(/^\d{6}-\d•{6}$/);
  });
});
