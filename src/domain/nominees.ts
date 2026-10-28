// 수급권자 — BR-11
import type { Policy } from './policy';

export type NomineeError = 'EMPTY' | 'TOO_MANY' | 'SUM_NOT_100' | 'INVALID_SHARE' | 'NAME_REQUIRED';

export function validateNominees(list: { name: string; share_pct: number }[], policy: Policy): NomineeError[] {
  const errs: NomineeError[] = [];
  if (list.length === 0) errs.push('EMPTY');
  if (list.length > policy.params.max_nominees.value) errs.push('TOO_MANY');
  if (list.some((n) => !Number.isInteger(n.share_pct) || n.share_pct <= 0 || n.share_pct > 100)) errs.push('INVALID_SHARE');
  if (list.some((n) => n.name.trim() === '')) errs.push('NAME_REQUIRED');
  if (list.length > 0 && list.reduce((s, n) => s + n.share_pct, 0) !== 100) errs.push('SUM_NOT_100');
  return errs;
}

/** 균등 배분 — 나머지는 첫 사람에게(1명 100, 2명 50·50, 3명 34·33·33) */
export function equalSplit(n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(100 / n);
  const shares = Array.from({ length: n }, () => base);
  shares[0] += 100 - base * n;
  return shares;
}
