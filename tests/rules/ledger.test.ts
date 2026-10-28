import { describe, expect, test } from 'vitest';
import { balance, declareDividend, monthlyRows, proRataDividend } from '../../src/domain';
import { entry } from './helpers';

describe('§5.2 잔액 = 원장 합계', () => {
  test('구성별 합계', () => {
    const es = [
      entry({ posted_at: '2026-01-10', kind: 'WORKER', amount: 80_000 }),
      entry({ posted_at: '2026-01-10', kind: 'EMPLOYER', amount: 40_000 }),
      entry({ posted_at: '2026-01-31', kind: 'DIVIDEND', amount: 1_000 }),
      entry({ posted_at: '2026-02-01', kind: 'ADJUST', amount: -500 }),
    ];
    expect(balance(es)).toEqual({ worker: 80_000, employer: 40_000, dividend: 1_000, other: -500, total: 120_500 });
  });
  test('기준일 이후 기입은 제외', () => {
    const es = [entry({ posted_at: '2026-11-10', kind: 'WORKER', amount: 100 })];
    expect(balance(es, '2026-10-15').total).toBe(0);
  });
  test('BR-19 정수 아닌 금액은 오류', () => {
    expect(() => balance([entry({ posted_at: '2026-01-10', kind: 'WORKER', amount: 0.5 })])).toThrow();
  });
});

describe('BR-05 배당은 확정 후에만 잔액에 들어간다', () => {
  const es = Array.from({ length: 12 }, (_, i) =>
    entry({ posted_at: `2025-${String(i + 1).padStart(2, '0')}-10`, kind: 'WORKER', amount: 120_000 }),
  );
  test('연 평균 잔액 × 배당률', () => {
    // 월말 잔액 120k,240k,...,1440k → 평균 780,000 × 3% = 23,400
    const d = declareDividend(es, 2025, 0.03, '2026-01-31');
    expect(d).toHaveLength(1);
    expect(d[0].amount).toBe(23_400);
    expect(d[0].kind).toBe('DIVIDEND');
  });
  test('확정 전(선언일 이전)에는 잔액에 없다', () => {
    const all = [...es, ...declareDividend(es, 2025, 0.03, '2026-01-31')];
    expect(balance(all, '2026-01-30').dividend).toBe(0);
    expect(balance(all, '2026-01-31').dividend).toBe(23_400);
  });
  test('잔액 0이면 배당 기입 없음', () => {
    expect(declareDividend([], 2025, 0.03, '2026-01-31')).toEqual([]);
  });
});

describe('BR-07 연중 일할 배당', () => {
  const es = [entry({ posted_at: '2025-12-10', kind: 'WORKER', amount: 1_000_000 })];
  test('7월 1일 지급: 1~6월 평균 잔액 × 3% × 182/365', () => {
    expect(proRataDividend(es, '2026-07-01', 0.03)).toBe(Math.floor(1_000_000 * 0.03 * (182 / 365)));
  });
  test('1월 지급은 현재 잔액 기준', () => {
    expect(proRataDividend(es, '2026-01-20', 0.03)).toBe(Math.floor(1_000_000 * 0.03 * (20 / 365)));
  });
});

describe('내역 월별 행', () => {
  test('누적은 원장 합계와 같다', () => {
    const es = [
      entry({ posted_at: '2026-02-10', ym: '2026-01', kind: 'WORKER', amount: 100 }),
      entry({ posted_at: '2026-02-10', ym: '2026-01', kind: 'EMPLOYER', amount: 50 }),
      entry({ posted_at: '2026-03-10', ym: '2026-02', kind: 'WORKER', amount: 100 }),
    ];
    const rows = monthlyRows(es);
    expect(rows.map((r) => r.cumulative)).toEqual([150, 250]);
    expect(rows.at(-1)!.cumulative).toBe(balance(es).total);
  });
});
