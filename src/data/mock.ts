// MockRepository — fixtures를 초기값으로, 변경분은 localStorage에 저장(실패하면 메모리만). §7.1
import {
  balance, claimTransition, clock, isDepartureDateAllowed, hasOpenClaim, maskAccount, memberStatusAfter, normalizeAccountNumber,
  policy, settlementEntries, validateNominees,
  type Actor, type BankAccount, type Claim, type ClaimAction, type Dataset, type ISODate, type RejectReason,
} from '../domain';
import { RepositoryError, type EmployerView, type MemberView, type NewBankAccount, type NewNominee, type Repository } from './repository';

const STORAGE_KEY = 'gongjehoe.v2.data';
/** fixtures는 첫 조회 때 따로 받는다(첫 화면 번들에서 제외, NFR-03) */
let base: Dataset;
const loadFixtures = () => import('../../fixtures/demo.json').then((m) => (base = m.default as unknown as Dataset));

function load(): Dataset {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Dataset;
      if (parsed.generated_from === base.generated_from) return parsed;
    }
  } catch {
    // 저장소 접근 불가 → fixtures로 시작
  }
  return structuredClone(base);
}

function save(ds: Dataset) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ds));
  } catch {
    // 사생활 보호 모드 등 — 메모리에만 유지
  }
}

/** 네트워크처럼 보이게 아주 짧게 지연(로딩 상태 확인용) */
const tick = <T,>(v: T): Promise<T> => new Promise((r) => setTimeout(() => r(v), 0));

export class MockRepository implements Repository {
  private ds!: Dataset;
  private ready: Promise<void>;

  constructor(initial?: Dataset) {
    this.ready = (initial ? Promise.resolve((base = initial)) : loadFixtures()).then(() => {
      this.ds = load();
    });
  }
  private listeners = new Set<() => void>();
  private seq = 0;

  private commit() {
    save(this.ds);
    this.listeners.forEach((l) => l());
  }

  private nextId(prefix: string) {
    this.seq += 1;
    const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : String(this.seq);
    return `${prefix}-${rand}-${this.seq}`;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  snapshot(): Dataset {
    if (!this.ds) throw new Error('not ready');
    return this.ds;
  }

  private view(memberId: string): MemberView {
    const ds = this.ds;
    const member = ds.members.find((m) => m.member_id === memberId);
    if (!member) throw new RepositoryError('MEMBER_NOT_FOUND');
    const person = ds.persons.find((p) => p.person_id === member.person_id)!;
    const visa = ds.visa_statuses.filter((v) => v.person_id === person.person_id).at(-1)!;
    const employments = ds.employments
      .filter((e) => e.member_id === memberId)
      .map((e) => ({ ...e, employer: ds.employers.find((x) => x.employer_id === e.employer_id)! }));
    const empIds = new Set(employments.map((e) => e.employment_id));
    const bills = ds.bills.filter((b) => empIds.has(b.employment_id));
    const billIds = new Set(bills.map((b) => b.bill_id));
    const claims = ds.claims.filter((c) => c.member_id === memberId);
    const claimIds = new Set(claims.map((c) => c.claim_id));
    const today = clock.today();
    return {
      member,
      person,
      visa,
      employments,
      bills,
      payments: ds.payments.filter((p) => billIds.has(p.bill_id) && p.paid_at <= today),
      ledger: ds.ledger.filter((e) => e.member_id === memberId && e.posted_at <= today),
      dividends: ds.dividends,
      nominees: ds.nominees.filter((n) => n.member_id === memberId),
      bankAccounts: ds.bank_accounts.filter((a) => a.member_id === memberId),
      claims,
      claimEvents: ds.claim_events.filter((e) => claimIds.has(e.claim_id)),
      notifications: ds.notifications.filter((n) => n.member_id === memberId && n.at <= today),
    };
  }

  async listMembers() {
    await this.ready;
    return tick(this.ds.members.map((m) => this.view(m.member_id)));
  }

  async getMember(memberId: string) {
    await this.ready;
    return tick(this.view(memberId));
  }

  async listEmployers() {
    await this.ready;
    return tick(this.ds.employers);
  }

  async getEmployer(employerId: string): Promise<EmployerView> {
    await this.ready;
    const employer = this.ds.employers.find((e) => e.employer_id === employerId);
    if (!employer) throw new RepositoryError('EMPLOYER_NOT_FOUND');
    const memberIds = [...new Set(this.ds.employments.filter((e) => e.employer_id === employerId).map((e) => e.member_id))];
    return tick({ employer, workers: memberIds.map((m) => this.view(m)) });
  }

  async listClaims() {
    await this.ready;
    return tick(
      [...this.ds.claims]
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .map((c) => ({ ...c, events: this.ds.claim_events.filter((e) => e.claim_id === c.claim_id) })),
    );
  }

  async submitClaim(input: { memberId: string; departure_date: ISODate; bank_account_id: string }): Promise<Claim> {
    await this.ready;
    const today = clock.today();
    const v = this.view(input.memberId);
    if (!isDepartureDateAllowed(input.departure_date, today, policy)) throw new RepositoryError('DEPARTURE_OUT_OF_WINDOW');
    if (hasOpenClaim(v.claims)) throw new RepositoryError('OPEN_CLAIM_EXISTS');
    if (!v.bankAccounts.some((a) => a.id === input.bank_account_id)) throw new RepositoryError('ACCOUNT_NOT_FOUND');
    const draft: Claim = {
      claim_id: this.nextId('CL'),
      member_id: input.memberId,
      type: 'DEPARTURE',
      status: 'DRAFT',
      departure_date: input.departure_date,
      amount_snapshot: balance(v.ledger, today).total,
      bank_account_id: input.bank_account_id,
      created_at: today,
      reject_reason: null,
    };
    this.ds.claims.push(draft);
    const c = this.apply(draft.claim_id, 'SUBMIT', 'WORKER');
    this.ds.consents.push({ id: this.nextId('CS'), member_id: input.memberId, kind: 'CLAIM_DECLARATION', agreed_at: today, version: '2026.10' });
    this.commit();
    return tick(c);
  }

  private apply(claimId: string, action: ClaimAction, actor: Actor, reason?: RejectReason): Claim {
    const ds = this.ds;
    const idx = ds.claims.findIndex((c) => c.claim_id === claimId);
    if (idx < 0) throw new RepositoryError('CLAIM_NOT_FOUND');
    const today = clock.today();
    const r = claimTransition(ds.claims[idx], action, actor, today, reason);
    if (!r.ok) throw new RepositoryError(r.error);
    ds.claims[idx] = r.claim;
    ds.claim_events.push({ id: this.nextId('CE'), ...r.event });
    const m = ds.members.find((x) => x.member_id === r.claim.member_id)!;
    m.status = memberStatusAfter(r.claim.status, m.status);
    if (r.claim.status === 'PAID') {
      // BR-07: 일할 배당 → 잔액 전부 지급 → 잔액 0
      const entries = ds.ledger.filter((e) => e.member_id === m.member_id && e.posted_at <= today);
      const lastRate = ds.dividends.at(-1)?.rate ?? policy.params.demo_dividend_rate.value;
      const add = settlementEntries(entries, r.claim, today, lastRate);
      ds.ledger.push(...add);
      const acct = ds.bank_accounts.find((a) => a.id === r.claim.bank_account_id)!;
      ds.payouts.push({
        payout_id: this.nextId('PO'),
        claim_id: claimId,
        bank_account_id: acct.id,
        nominee_id: null,
        amount_krw: -add.at(-1)!.amount,
        currency: acct.currency,
        fx_rate_display: null,
        status: 'PAID',
      });
    }
    ds.notifications.push({
      id: this.nextId('NT'),
      member_id: m.member_id,
      kind: 'CLAIM_STATUS',
      payload: { claim_id: claimId, status: r.claim.status },
      at: today,
      read: false,
    });
    return r.claim;
  }

  async transitionClaim(claimId: string, action: ClaimAction, actor: Actor, reason?: RejectReason) {
    await this.ready;
    const c = this.apply(claimId, action, actor, reason);
    this.commit();
    return tick(c);
  }

  async saveNominees(memberId: string, list: NewNominee[]) {
    await this.ready;
    const errs = validateNominees(list, policy);
    if (errs.length) throw new RepositoryError(errs[0]);
    this.ds.nominees = this.ds.nominees.filter((n) => n.member_id !== memberId);
    const saved = list.map((n) => ({ id: this.nextId('N'), member_id: memberId, ...n, kyc_status: 'PENDING' as const }));
    this.ds.nominees.push(...saved);
    this.commit();
    return tick(saved);
  }

  async addBankAccount(memberId: string, input: NewBankAccount): Promise<BankAccount> {
    await this.ready;
    const number = normalizeAccountNumber(input.account_number);
    if (!/^[0-9]{6,20}$/.test(number)) throw new RepositoryError('INVALID_ACCOUNT');
    for (const a of this.ds.bank_accounts) if (a.member_id === memberId) a.active = false;
    const acct: BankAccount = {
      id: this.nextId('BA'),
      member_id: memberId,
      country_iso2: input.country_iso2,
      bank_name: input.bank_name,
      account_masked: maskAccount(number),
      holder_name: input.holder_name.trim().toUpperCase(),
      currency: input.currency,
      verified: false,
      active: true,
    };
    this.ds.bank_accounts.push(acct);
    this.commit();
    return tick(acct);
  }

  async setActiveBankAccount(memberId: string, accountId: string) {
    await this.ready;
    for (const a of this.ds.bank_accounts) if (a.member_id === memberId) a.active = a.id === accountId;
    this.commit();
    return tick(undefined);
  }

  async reset() {
    await this.ready;
    this.ds = structuredClone(base);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 무시
    }
    this.commit();
  }
}
