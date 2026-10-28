// 도메인 모델 — 설계서 §5.1 ERD와 1:1 대응
// 날짜는 'YYYY-MM-DD', 년월은 'YYYY-MM', 일시는 ISO 문자열. 금액은 원 단위 정수(BR-19).

export type YM = string;
export type ISODate = string;

export type Lang = 'ko' | 'en' | 'vi' | 'ne' | 'id';

export interface Person {
  person_id: string;
  name_latin: string;
  name_native: string;
  nationality_iso2: string;
  birth_date: ISODate;
  rid_masked: string;
}

export interface VisaStatus {
  id: string;
  person_id: string;
  visa_type: 'E-9' | 'H-2' | 'E-7-4';
  valid_from: ISODate;
  valid_to: ISODate | null;
}

export type MemberStatus = 'ACTIVE' | 'DEPARTING' | 'CLOSED' | 'CONVERTED';

export interface Member {
  member_id: string;
  person_id: string;
  status: MemberStatus;
  joined_ym: YM;
  lang: Lang;
}

export interface Employer {
  employer_id: string;
  name: string;
  biz_no_masked: string;
}

export interface Employment {
  employment_id: string;
  member_id: string;
  employer_id: string;
  start_date: ISODate;
  end_date: ISODate | null;
  end_reason: 'TRANSFER' | 'DEPARTURE' | null;
}

export interface WageReport {
  id: string;
  employment_id: string;
  ym: YM;
  wage_krw: number;
}

export type BillStatus = 'ISSUED' | 'PAID' | 'OVERDUE';

export interface ContributionBill {
  bill_id: string;
  employment_id: string;
  ym: YM;
  member_month_seq: number;
  wage_krw: number;
  worker_rate: number;
  employer_rate: number;
  worker_amt: number;
  employer_amt: number;
  policy_version_id: string;
  due_date: ISODate;
  status: BillStatus;
}

export interface Payment {
  payment_id: string;
  bill_id: string;
  paid_at: ISODate;
  amount: number;
  channel: '통합징수';
}

export type LedgerKind = 'WORKER' | 'EMPLOYER' | 'DIVIDEND' | 'PAYOUT' | 'TRANSFER_OUT' | 'ADJUST';

export interface LedgerEntry {
  entry_id: string;
  member_id: string;
  posted_at: ISODate;
  ym: YM;
  kind: LedgerKind;
  amount: number;
  ref_type: 'BILL' | 'DIVIDEND' | 'CLAIM' | 'ADJUST';
  ref_id: string;
}

export interface DividendDeclaration {
  year: number;
  rate: number;
  declared_at: ISODate;
  demo: boolean;
}

export type ClaimType = 'DEPARTURE' | 'DEATH' | 'CONVERSION';
export type ClaimStatus = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'PAYING' | 'PAID' | 'CANCELLED' | 'REJECTED';
export type ClaimAction = 'SUBMIT' | 'CANCEL' | 'VERIFY' | 'APPROVE' | 'PAY' | 'REJECT';
export type Actor = 'WORKER' | 'SYSTEM' | 'ADMIN';
export type RejectReason = 'NO_DEPARTURE_RECORD' | 'ACCOUNT_MISMATCH' | 'DUPLICATE';

export interface Claim {
  claim_id: string;
  member_id: string;
  type: ClaimType;
  status: ClaimStatus;
  departure_date: ISODate;
  amount_snapshot: number;
  bank_account_id: string;
  created_at: ISODate;
  reject_reason: RejectReason | null;
}

export interface ClaimEvent {
  id: string;
  claim_id: string;
  from_status: ClaimStatus | null;
  to_status: ClaimStatus;
  at: ISODate;
  actor: Actor;
}

export interface Payout {
  payout_id: string;
  claim_id: string;
  bank_account_id: string;
  nominee_id: string | null;
  amount_krw: number;
  currency: string;
  fx_rate_display: number | null;
  status: 'PAID';
}

export interface BankAccount {
  id: string;
  member_id: string;
  country_iso2: string;
  bank_name: string;
  account_masked: string;
  holder_name: string;
  currency: string;
  verified: boolean;
  active: boolean;
}

export type Relation = 'SPOUSE' | 'CHILD' | 'MOTHER' | 'FATHER' | 'SIBLING' | 'OTHER';

export interface Nominee {
  id: string;
  member_id: string;
  name: string;
  relation: Relation;
  share_pct: number;
  contact: string;
  kyc_status: 'PENDING' | 'VERIFIED';
}

export interface Consent {
  id: string;
  member_id: string;
  kind: 'TERMS' | 'PRIVACY' | 'CLAIM_DECLARATION' | 'STUDY';
  agreed_at: ISODate;
  version: string;
}

export type NotificationKind = 'PAID' | 'UNPAID' | 'DIVIDEND' | 'NOMINEE_MISSING' | 'CLAIM_STATUS' | 'HI_ARREARS';

export interface Notification {
  id: string;
  member_id: string;
  kind: NotificationKind;
  payload: Record<string, string | number>;
  at: ISODate;
  read: boolean;
}

export interface UserAccount {
  id: string;
  role: 'WORKER' | 'EMPLOYER' | 'ADMIN';
  member_id: string | null;
  employer_id: string | null;
}

/** fixtures/demo.json 전체 구조 */
export interface Dataset {
  generated_from: string;
  persons: Person[];
  visa_statuses: VisaStatus[];
  members: Member[];
  employers: Employer[];
  employments: Employment[];
  wage_reports: WageReport[];
  bills: ContributionBill[];
  payments: Payment[];
  ledger: LedgerEntry[];
  dividends: DividendDeclaration[];
  claims: Claim[];
  claim_events: ClaimEvent[];
  payouts: Payout[];
  bank_accounts: BankAccount[];
  nominees: Nominee[];
  consents: Consent[];
  notifications: Notification[];
  user_accounts: UserAccount[];
}
