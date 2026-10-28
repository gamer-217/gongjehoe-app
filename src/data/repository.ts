// 저장소 인터페이스(§7.1) — 백엔드 교체 지점은 여기 하나. MockRepository → 나중에 HttpRepository
import type {
  Actor, BankAccount, Claim, ClaimAction, ClaimEvent, ContributionBill, Dataset, DividendDeclaration, Employer, Employment,
  ISODate, LedgerEntry, Member, Nominee, Notification, Payment, Person, RejectReason, VisaStatus,
} from '../domain';

export interface MemberView {
  member: Member;
  person: Person;
  visa: VisaStatus;
  employments: (Employment & { employer: Employer })[];
  bills: ContributionBill[];
  payments: Payment[];
  ledger: LedgerEntry[];
  dividends: DividendDeclaration[];
  nominees: Nominee[];
  bankAccounts: BankAccount[];
  claims: Claim[];
  claimEvents: ClaimEvent[];
  notifications: Notification[];
}

export interface EmployerView {
  employer: Employer;
  /** 이 사업장에 고용 이력이 있는 근로자 */
  workers: MemberView[];
}

export interface NewBankAccount {
  country_iso2: string;
  bank_name: string;
  account_number: string;
  holder_name: string;
  currency: string;
}

export interface NewNominee {
  name: string;
  relation: Nominee['relation'];
  share_pct: number;
  contact: string;
}

export interface Repository {
  listMembers(): Promise<MemberView[]>;
  getMember(memberId: string): Promise<MemberView>;
  getEmployer(employerId: string): Promise<EmployerView>;
  listEmployers(): Promise<Employer[]>;
  listClaims(): Promise<(Claim & { events: ClaimEvent[] })[]>;
  submitClaim(input: { memberId: string; departure_date: ISODate; bank_account_id: string }): Promise<Claim>;
  transitionClaim(claimId: string, action: ClaimAction, actor: Actor, reason?: RejectReason): Promise<Claim>;
  saveNominees(memberId: string, list: NewNominee[]): Promise<Nominee[]>;
  addBankAccount(memberId: string, input: NewBankAccount): Promise<BankAccount>;
  setActiveBankAccount(memberId: string, accountId: string): Promise<void>;
  reset(): Promise<void>;
  subscribe(listener: () => void): () => void;
  /** 테스트·디버그용 */
  snapshot(): Dataset;
}

export class RepositoryError extends Error {
  constructor(public code: string) {
    super(code);
  }
}
