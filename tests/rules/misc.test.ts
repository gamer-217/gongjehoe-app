import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  addDays, clock, coverageMap, diffDays, equalSplit, horizonChips, isValidAccountNumber, maskAccount, normalizeAccountNumber,
  npsApplicable, npsEmployerRate, npsLumpSumEstimate, policy, project, validateNominees,
} from '../../src/domain';

describe('BR-11 수급권자 지분', () => {
  test.each([
    [[99], ['SUM_NOT_100']], [[100], []], [[101], ['INVALID_SHARE', 'SUM_NOT_100']],
    [[50, 49], ['SUM_NOT_100']], [[50, 50], []], [[34, 33, 33], []], [[34, 33, 34], ['SUM_NOT_100']],
  ])('%j → %j', (shares, errs) => {
    expect(validateNominees(shares.map((s) => ({ name: 'A', share_pct: s })), policy)).toEqual(errs);
  });
  test('최대 3명', () => {
    expect(validateNominees([25, 25, 25, 25].map((s) => ({ name: 'A', share_pct: s })), policy)).toContain('TOO_MANY');
  });
  test('균등 배분은 나머지를 첫 사람에게', () => {
    expect(equalSplit(1)).toEqual([100]);
    expect(equalSplit(2)).toEqual([50, 50]);
    expect(equalSplit(3)).toEqual([34, 33, 33]);
  });
  test('지분 칩', () => {
    expect(policy.params.nominee_share_chips.value).toEqual([100, 50, 34, 33]);
  });
});

describe('BR-17 국가별 국민연금 적용 전체 표', () => {
  test.each([['NP', false], ['VN', true], ['ID', true], ['CN', true], ['ZZ', false]])('%s → %s', (cc, ok) => {
    expect(npsApplicable(cc, policy).applicable).toBe(ok);
  });
  test('표의 모든 국가에 출처 메모와 검증 표시가 있다', () => {
    for (const c of Object.values(policy.nps.countries)) {
      expect(typeof c.verified).toBe('boolean');
      expect(c.note.length).toBeGreaterThan(0);
    }
  });
  test('비적용국은 반환일시금 0', () => {
    expect(npsLumpSumEstimate({ nationality_iso2: 'NP', wages: [{ ym: '2026-01', wage: 2_000_000 }] }, policy).total).toBe(0);
  });
  test('BR-16 이자율 미검증이면 원금만', () => {
    const r = npsLumpSumEstimate({ nationality_iso2: 'VN', wages: [{ ym: '2025-01', wage: 2_000_000 }, { ym: '2026-01', wage: 2_000_000 }] }, policy);
    expect(r.interestIncluded).toBe(policy.params.nps_lump_sum_interest.verified);
    expect(r.principal).toBe(180_000 + 190_000);
  });
});

describe('BR-15 국민연금 사용자 부담률', () => {
  test.each([[2026, 0.0475], [2030, 0.0575], [2033, 0.065], [2040, 0.065]])('%i → %f', (y, r) => {
    expect(npsEmployerRate(y, policy)).toBeCloseTo(r, 6);
  });
});

describe('BR-06 시뮬레이션', () => {
  const input = { confirmedTotal: 1_000_000, lastWage: 2_000_000, lastSeq: 24, lastYm: '2026-09' };
  test('지금(0개월)은 확정 잔액 그대로', () => {
    expect(project(input, 0, policy).total).toBe(1_000_000);
  });
  test('미래 기여는 요율 단계를 따른다(25개월째부터 3%)', () => {
    const p = project(input, 1, policy, 0);
    expect(p.futureContributions).toBe(80_000 + 60_000);
    expect(p.assumedReturn).toBe(0);
  });
  test('만기 칩은 만기 전에만', () => {
    expect(horizonChips(36, policy).map((c) => c.key)).toEqual(['now', 'm6', 'm12', 'maturity']);
    expect(horizonChips(70, policy).map((c) => c.key)).toEqual(['now', 'm6', 'm12']);
  });
});

describe('보장 지도', () => {
  test('네팔은 국민연금 빈자리(제외), 베트남은 가입', () => {
    expect(coverageMap({ nationality_iso2: 'NP' }, policy).gap.map((i) => i.key)).toContain('nps_off');
    expect(coverageMap({ nationality_iso2: 'VN' }, policy).gap.map((i) => i.key)).toContain('nps_on');
  });
  test('공제회는 제안 라벨', () => {
    expect(coverageMap({ nationality_iso2: 'NP' }, policy).leave.find((i) => i.key === 'gongje')!.status).toBe('new');
  });
});

describe('BR-19 계좌번호 정리', () => {
  test('공백·하이픈 허용', () => {
    expect(normalizeAccountNumber('110-123 456-789')).toBe('110123456789');
    expect(isValidAccountNumber('110-123 456-789')).toBe(true);
    expect(isValidAccountNumber('12-ab')).toBe(false);
    expect(maskAccount('110-123-456789')).toBe('••••••••6789');
  });
});

describe('BR-22 기준일은 시계 모듈 하나', () => {
  test('기준일 2026-10-15', () => {
    expect(clock.today()).toBe('2026-10-15');
    expect(clock.latestPaidYm()).toBe('2026-09');
  });
  test('날짜 산술', () => {
    expect(addDays('2026-10-15', 30)).toBe('2026-11-14');
    expect(diffDays('2027-01-01', '2026-01-01')).toBe(365);
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
  test('src에서 Date.now()·new Date() 직접 사용 금지(clock.ts 제외)', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(f) && !p.endsWith('clock.ts')) {
          const src = readFileSync(p, 'utf8');
          if (/Date\.now\(|new Date\(/.test(src)) offenders.push(p);
        }
      }
    };
    walk('src');
    expect(offenders).toEqual([]);
  });
});

describe('NFR-06 정책 값에는 모두 출처가 있다', () => {
  test('params 각 항목 source·label', () => {
    for (const [k, p] of Object.entries(policy.params)) {
      expect(p.source, k).toBeTruthy();
      expect(['법령', '제안', '가정', '결정'], k).toContain(p.label);
    }
  });
});

describe('A-30 재정 시뮬레이터 이식', () => {
  test('기본값으로 30년 계산, 적립금은 양수', async () => {
    const { simulateFund, defaultFundParams, ocbAt } = await import('../../src/domain');
    const r = simulateFund(defaultFundParams());
    expect(r.rows).toHaveLength(30);
    expect(r.rows.at(-1)!.fund).toBeGreaterThan(0);
    expect(ocbAt(4)).toBe(2.25);
    expect(ocbAt(15)).toBeCloseTo(11.7, 1);
  });
});
