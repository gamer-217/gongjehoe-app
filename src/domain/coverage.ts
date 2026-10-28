// 보장 지도 — 저장하지 않고 규칙표로 계산(§5.2-5)
import type { CoverageRule, Policy } from './policy';
import { npsApplicable } from './nps';

export interface CoverageItem {
  key: string;
  status: CoverageRule['status'];
}

export interface CoverageMap {
  now: CoverageItem[];
  leave: CoverageItem[];
  gap: CoverageItem[];
}

export function coverageMap(member: { nationality_iso2: string }, policy: Policy): CoverageMap {
  const nps = npsApplicable(member.nationality_iso2, policy).applicable;
  const out: CoverageMap = { now: [], leave: [], gap: [] };
  for (const r of policy.coverage.items) {
    if (r.when?.nps !== undefined && r.when.nps !== nps) continue;
    out[r.group].push({ key: r.key, status: r.status });
  }
  return out;
}
