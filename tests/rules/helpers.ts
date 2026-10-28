import type { LedgerEntry } from '../../src/domain';

let n = 0;
export function entry(p: Partial<LedgerEntry> & Pick<LedgerEntry, 'posted_at' | 'kind' | 'amount'>): LedgerEntry {
  n += 1;
  return { entry_id: `E${n}`, member_id: 'M1', ym: p.posted_at.slice(0, 7), ref_type: 'BILL', ref_id: `B${n}`, ...p };
}
