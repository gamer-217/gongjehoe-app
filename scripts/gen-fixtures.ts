// 시연 데이터 생성(§5.3). 고용 이력·월 보수 → BILL·PAYMENT·LEDGER·배당. 손으로 쓴 총액을 넣지 않는다.
// 실행: npm run gen:fixtures  → fixtures/demo.json (직접 수정 금지)
import { writeFileSync } from 'node:fs';
import {
  addMonths, assignMonthSeq, billFor, declareDividend, dueDateFor, monthEnd, policy, ymIndex, yearOf,
  type BankAccount, type ContributionBill, type Dataset, type Employment, type LedgerEntry, type Nominee,
  type Notification, type Payment, type WageReport, type YM,
} from '../src/domain';

interface Stint {
  employer_id: string;
  from: YM;
  to: YM;
}
interface Seed {
  member_id: string;
  person: Dataset['persons'][number];
  lang: Dataset['members'][number]['lang'];
  visa: 'E-9' | 'H-2';
  /** 2026년 월 보수(레거시 v0.5의 고정 월급). 이전 연도는 최저임금 인상률만큼 낮춘다 */
  wage2026: number;
  stints: Stint[];
  bank: Omit<BankAccount, 'id' | 'member_id' | 'verified' | 'active'>;
  nominees: Omit<Nominee, 'id' | 'member_id'>[];
  hiArrears?: number;
}

const LATEST: YM = policy.demo.latest_paid_ym;

const seeds: Seed[] = [
  {
    member_id: 'W001',
    person: { person_id: 'P001', name_latin: 'Ramesh Gurung', name_native: 'रमेश गुरुङ', nationality_iso2: 'NP', birth_date: '1990-01-01', rid_masked: '900101-5••••••' },
    lang: 'ne', visa: 'E-9', wage2026: 2_400_000,
    stints: [{ employer_id: 'EMP01', from: '2023-10', to: LATEST }],
    bank: { country_iso2: 'NP', bank_name: 'Nabil Bank', account_masked: '••••••••3021', holder_name: 'RAMESH GURUNG', currency: 'NPR' },
    nominees: [],
  },
  {
    member_id: 'W002',
    person: { person_id: 'P002', name_latin: 'Nguyen Van An', name_native: 'Nguyễn Văn An', nationality_iso2: 'VN', birth_date: '1998-08-03', rid_masked: '980803-5••••••' },
    lang: 'vi', visa: 'E-9', wage2026: 2_610_000,
    // 13개월째 사업장 변경, 1개월 공백(2026-03) — 요율 연속성 시연(BR-03)
    stints: [
      { employer_id: 'EMP02', from: '2025-03', to: '2026-02' },
      { employer_id: 'EMP01', from: '2026-04', to: LATEST },
    ],
    bank: { country_iso2: 'VN', bank_name: 'Vietcombank', account_masked: '••••••••7754', holder_name: 'NGUYEN VAN AN', currency: 'VND' },
    nominees: [],
  },
  {
    member_id: 'W003',
    person: { person_id: 'P003', name_latin: 'Siti Rahma', name_native: 'Siti Rahma', nationality_iso2: 'ID', birth_date: '1993-02-17', rid_masked: '930217-6••••••' },
    lang: 'id', visa: 'E-9', wage2026: 2_500_000,
    stints: [{ employer_id: 'EMP01', from: '2022-06', to: LATEST }],
    bank: { country_iso2: 'ID', bank_name: 'Bank Mandiri', account_masked: '••••••••5108', holder_name: 'SITI RAHMA', currency: 'IDR' },
    nominees: [{ name: 'Ahmad Fauzi', relation: 'SPOUSE', share_pct: 100, contact: '+62 ••• •••• 4410', kyc_status: 'PENDING' }],
    hiArrears: 300_000,
  },
  {
    member_id: 'W004',
    person: { person_id: 'P004', name_latin: 'Kim Hairan', name_native: '김해란', nationality_iso2: 'CN', birth_date: '1986-05-12', rid_masked: '860512-6••••••' },
    lang: 'ko', visa: 'H-2', wage2026: 2_800_000,
    stints: [{ employer_id: 'EMP01', from: '2020-12', to: LATEST }],
    bank: { country_iso2: 'CN', bank_name: '中国银行 Bank of China', account_masked: '••••••••8836', holder_name: 'JIN HAILAN', currency: 'CNY' },
    nominees: [{ name: '김민', relation: 'CHILD', share_pct: 100, contact: '+86 ••• •••• 2290', kyc_status: 'VERIFIED' }],
  },
];

/** BR: 월 보수는 매년 최저임금 인상분만큼(§5.3). 10원 단위 반올림 */
function wageFor(seed: Seed, ym: YM): number {
  const mw = policy.minWage.years;
  const y = String(yearOf(ym));
  if (!policy.minWage.verified || !mw[y]) return seed.wage2026;
  return Math.round((seed.wage2026 * mw[y].hourly) / mw['2026'].hourly / 10) * 10;
}

const ds: Dataset = {
  generated_from: `scripts/gen-fixtures.ts · policy ${policy.version_id} · 기준 ${policy.demo.today}`,
  persons: [], visa_statuses: [], members: [], employers: [
    { employer_id: 'EMP01', name: '한빛정밀(주)', biz_no_masked: '123-45-•••••' },
    { employer_id: 'EMP02', name: '대성농산', biz_no_masked: '214-87-•••••' },
  ],
  employments: [], wage_reports: [], bills: [], payments: [], ledger: [], dividends: [],
  claims: [], claim_events: [], payouts: [], bank_accounts: [], nominees: [], consents: [], notifications: [],
  user_accounts: [
    { id: 'U-EMP01', role: 'EMPLOYER', member_id: null, employer_id: 'EMP01' },
    { id: 'U-ADMIN', role: 'ADMIN', member_id: null, employer_id: null },
  ],
};

const firstYear = Math.min(...seeds.map((s) => yearOf(s.stints[0].from)));
const lastDeclaredYear = yearOf(policy.demo.today) - 1;
for (let y = firstYear; y <= lastDeclaredYear; y++) {
  ds.dividends.push({ year: y, rate: policy.params.demo_dividend_rate.value, declared_at: `${y + 1}-01-31`, demo: true });
}

for (const s of seeds) {
  const firstYm = s.stints[0].from;
  ds.persons.push(s.person);
  ds.visa_statuses.push({ id: `V-${s.member_id}`, person_id: s.person.person_id, visa_type: s.visa, valid_from: `${firstYm}-01`, valid_to: null });
  ds.members.push({ member_id: s.member_id, person_id: s.person.person_id, status: 'ACTIVE', joined_ym: firstYm, lang: s.lang });
  ds.user_accounts.push({ id: `U-${s.member_id}`, role: 'WORKER', member_id: s.member_id, employer_id: null });
  ds.consents.push(
    { id: `CS-${s.member_id}-T`, member_id: s.member_id, kind: 'TERMS', agreed_at: `${firstYm}-01`, version: '2026.10' },
    { id: `CS-${s.member_id}-P`, member_id: s.member_id, kind: 'PRIVACY', agreed_at: `${firstYm}-01`, version: '2026.10' },
  );

  // 고용별 부과 년월
  const months: { emp: Employment; ym: YM }[] = [];
  s.stints.forEach((st, i) => {
    const isLast = i === s.stints.length - 1;
    const emp: Employment = {
      employment_id: `${s.member_id}-E${i + 1}`,
      member_id: s.member_id,
      employer_id: st.employer_id,
      start_date: `${st.from}-01`,
      end_date: isLast ? null : monthEnd(st.to),
      end_reason: isLast ? null : 'TRANSFER',
    };
    ds.employments.push(emp);
    for (let k = ymIndex(st.from); k <= ymIndex(st.to); k++) months.push({ emp, ym: addMonths('0000-01', k) });
  });
  const seqOf = assignMonthSeq(months.map((m) => m.ym));

  const entries: LedgerEntry[] = [];
  for (const { emp, ym } of months) {
    const wage = wageFor(s, ym);
    const seq = seqOf.get(ym)!;
    const amt = billFor(emp, wage, seq, policy);
    const billId = `B-${emp.employment_id}-${ym}`;
    const due = dueDateFor(ym, policy);
    const paidAt = due; // 통합징수 납기일 수납
    const wr: WageReport = { id: `WR-${emp.employment_id}-${ym}`, employment_id: emp.employment_id, ym, wage_krw: wage };
    const bill: ContributionBill = {
      bill_id: billId, employment_id: emp.employment_id, ym, member_month_seq: seq, wage_krw: wage, ...amt,
      policy_version_id: policy.version_id, due_date: due, status: 'PAID',
    };
    const pay: Payment = { payment_id: `PM-${billId}`, bill_id: billId, paid_at: paidAt, amount: amt.worker_amt + amt.employer_amt, channel: '통합징수' };
    ds.wage_reports.push(wr);
    ds.bills.push(bill);
    ds.payments.push(pay);
    entries.push(
      { entry_id: `L-${billId}-W`, member_id: s.member_id, posted_at: paidAt, ym, kind: 'WORKER', amount: amt.worker_amt, ref_type: 'BILL', ref_id: billId },
      { entry_id: `L-${billId}-E`, member_id: s.member_id, posted_at: paidAt, ym, kind: 'EMPLOYER', amount: amt.employer_amt, ref_type: 'BILL', ref_id: billId },
    );
  }
  // BR-05 연 1회 확정 배당(시연용 가정 배당). 앞선 해 배당까지 포함한 원장으로 계산
  for (const d of ds.dividends) {
    const upto = entries.filter((e) => e.posted_at <= d.declared_at);
    entries.push(...declareDividend(upto, d.year, d.rate, d.declared_at, (m) => `L-DIV-${d.year}-${m}`));
  }
  entries.sort((a, b) => (a.posted_at < b.posted_at ? -1 : a.posted_at > b.posted_at ? 1 : a.entry_id.localeCompare(b.entry_id)));
  ds.ledger.push(...entries);

  ds.bank_accounts.push({ id: `BA-${s.member_id}-1`, member_id: s.member_id, ...s.bank, verified: true, active: true });
  s.nominees.forEach((n, i) => ds.nominees.push({ id: `N-${s.member_id}-${i + 1}`, member_id: s.member_id, ...n }));

  const latestBill = ds.bills.filter((b) => b.employment_id.startsWith(s.member_id)).at(-1)!;
  const notes: Notification[] = [
    { id: `NT-${s.member_id}-PAID`, member_id: s.member_id, kind: 'PAID', payload: { ym: latestBill.ym }, at: latestBill.due_date, read: false },
  ];
  const lastDiv = entries.filter((e) => e.kind === 'DIVIDEND').at(-1);
  if (lastDiv) notes.push({ id: `NT-${s.member_id}-DIV`, member_id: s.member_id, kind: 'DIVIDEND', payload: { year: Number(lastDiv.ref_id), amount: lastDiv.amount }, at: lastDiv.posted_at, read: true });
  if (s.hiArrears) notes.push({ id: `NT-${s.member_id}-HI`, member_id: s.member_id, kind: 'HI_ARREARS', payload: { amount: s.hiArrears, source: 'NHIS' }, at: '2026-10-01', read: false });
  ds.notifications.push(...notes);
}

writeFileSync('fixtures/demo.json', JSON.stringify(ds, null, 1) + '\n');
for (const s of seeds) {
  const total = ds.ledger.filter((e) => e.member_id === s.member_id).reduce((a, e) => a + e.amount, 0);
  const seq = ds.bills.filter((b) => b.employment_id.startsWith(s.member_id)).at(-1)!.member_month_seq;
  console.log(`${s.member_id} ${s.person.name_latin.padEnd(14)} ${String(seq).padStart(2)}개월  총 ${total.toLocaleString('ko-KR')}원`);
}
