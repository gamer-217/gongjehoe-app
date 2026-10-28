import { describe, expect, test } from 'vitest';
import { assignMonthSeq, billFor, dueDateFor, employerRateFor, maturityProgress, payStateOf, policy, rateStepFor } from '../../src/domain';

const emp = { employment_id: 'EMP1' };

describe('BR-01 근로자 기여율 4%', () => {
  test.each([
    [2_000_000, 80_000],
    [2_156_880, 86_275],
    [2_610_000, 104_400],
    [0, 0],
  ])('월 %i원 → %i원', (wage, expected) => {
    expect(billFor(emp, wage, 1, policy).worker_amt).toBe(expected);
  });
  test('정수 아닌 월급은 거부(BR-19)', () => {
    expect(() => billFor(emp, 1000.5, 1, policy)).toThrow();
  });
});

describe('BR-02 사업주 요율 단계 경계', () => {
  test.each([
    [1, 0.02], [24, 0.02], [25, 0.03], [48, 0.03], [49, 0.04], [58, 0.04],
  ])('%i개월째 → %f', (seq, rate) => {
    expect(employerRateFor(seq, policy)).toBe(rate);
  });
  test.each([[24, 1], [25, 2], [49, 3]])('%i개월째 단계 %i', (seq, step) => {
    expect(rateStepFor(seq, policy)).toBe(step);
  });
  test('사업주 금액 = 월급 × 요율, 원 미만 버림', () => {
    expect(billFor(emp, 2_345_678, 25, policy).employer_amt).toBe(70_370);
  });
  test('seq 0 이하는 오류', () => {
    expect(() => employerRateFor(0, policy)).toThrow();
  });
});

describe('BR-03 요율 단계는 가입 누적 개월 기준', () => {
  test('사업장 변경 공백 달은 세지 않는다', () => {
    const yms = ['2025-11', '2025-12', '2026-02', '2026-03'];
    const seq = assignMonthSeq(yms);
    expect(seq.get('2026-02')).toBe(3);
    expect(seq.get('2026-03')).toBe(4);
  });
  test('같은 달 고용 둘 → seq 하나', () => {
    const seq = assignMonthSeq(['2026-01', '2026-02', '2026-02', '2026-03']);
    expect(seq.size).toBe(3);
    expect(seq.get('2026-03')).toBe(3);
  });
  test('새 사업장에서 1부터 다시 세지 않는다(24→25개월 단계 상승 유지)', () => {
    const before = Array.from({ length: 24 }, (_, i) => `2024-${String((i % 12) + 1).padStart(2, '0')}`.replace('2024', String(2024 + Math.floor(i / 12))));
    const seq = assignMonthSeq([...before, '2026-03']);
    expect(seq.get('2026-03')).toBe(25);
    expect(employerRateFor(seq.get('2026-03')!, policy)).toBe(0.03);
  });
  test('월급이 바뀌면 그달 금액만 바뀐다', () => {
    expect(billFor(emp, 2_000_000, 10, policy).worker_amt).toBe(80_000);
    expect(billFor(emp, 2_100_000, 11, policy).worker_amt).toBe(84_000);
  });
});

describe('BR-04 만기 58개월', () => {
  test.each([
    [57, false, 0], [58, true, 0], [59, true, 1], [70, true, 12],
  ])('%i개월 → 만기 %s, 초과 %i', (seq, matured, over) => {
    const m = maturityProgress(seq, policy);
    expect(m.matured).toBe(matured);
    expect(m.overMonths).toBe(over);
    expect(m.ratio).toBeLessThanOrEqual(1);
  });
  test('만기 초과(70개월)에도 적립 계속, 사업주 4% 유지', () => {
    const b = billFor(emp, 2_800_000, 70, policy);
    expect(b.employer_rate).toBe(0.04);
    expect(b.worker_amt + b.employer_amt).toBe(224_000);
  });
});

describe('BR-21 납부 기한 = 다음 달 10일', () => {
  test.each([['2026-09', '2026-10-10'], ['2026-12', '2027-01-10']])('%s → %s', (ym, due) => {
    expect(dueDateFor(ym, policy)).toBe(due);
  });
  test('납입 상태: 납입 확인 / 확인 전 / 미납', () => {
    expect(payStateOf({ due_date: '2026-10-10' }, true, '2026-10-15')).toBe('PAID');
    expect(payStateOf({ due_date: '2026-10-10' }, false, '2026-10-10')).toBe('PENDING');
    expect(payStateOf({ due_date: '2026-10-10' }, false, '2026-10-11')).toBe('OVERDUE');
  });
});
