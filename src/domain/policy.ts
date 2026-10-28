// policy/*.json을 타입이 있는 객체로 읽는다. 제도 수치는 여기서만 나온다(NFR-06).
import paramsJson from '../../policy/params.json' with { type: 'json' };
import npsJson from '../../policy/nps_countries.json' with { type: 'json' };
import coverageJson from '../../policy/coverage.json' with { type: 'json' };
import minWageJson from '../../policy/min_wage.json' with { type: 'json' };
import demoJson from '../../policy/demo.json' with { type: 'json' };

export type Label = '법령' | '제안' | '가정' | '결정';

export interface Param<T> {
  value: T;
  label: Label;
  verified: boolean;
  rule: string;
  source: string;
  note?: string;
}

export interface RateStep {
  from_month: number;
  rate: number;
}

export interface CoverageRule {
  key: string;
  group: 'now' | 'leave' | 'gap';
  status: 'on' | 'opt' | 'x' | 'new';
  when?: { nps?: boolean };
}

export interface NpsCountry {
  applicable: boolean;
  verified: boolean;
  note: string;
}

export interface Policy {
  version_id: string;
  effective_from: string;
  params: {
    worker_rate: Param<number>;
    employer_rate_steps: Param<RateStep[]>;
    maturity_months: Param<number>;
    demo_dividend_rate: Param<number>;
    projection_rate: Param<number>;
    payout_target_business_days: Param<number>;
    claim_window_days: Param<number>;
    max_nominees: Param<number>;
    nominee_share_chips: Param<number[]>;
    departure_insurance_rate: Param<number>;
    nps_total_rate_by_year: Param<Record<string, number>>;
    nps_lump_sum_interest: Param<number>;
    contribution_due_day: Param<number>;
    nps_helpline: Param<string>;
    foreign_helpline: Param<string>;
    eps_helpline: Param<string>;
    nps_min_years: Param<number>;
  };
  nps: { source: string; countries: Record<string, NpsCountry> };
  coverage: { source: string; items: CoverageRule[] };
  minWage: { label: Label; verified: boolean; source: string; years: Record<string, { hourly: number }> };
  demo: { today: string; latest_paid_ym: string };
}

export const policy: Policy = {
  version_id: paramsJson.version_id,
  effective_from: paramsJson.effective_from,
  params: paramsJson.params as unknown as Policy['params'],
  nps: npsJson as Policy['nps'],
  coverage: coverageJson as Policy['coverage'],
  minWage: minWageJson as Policy['minWage'],
  demo: demoJson,
};

/** 화면에 숫자로 낼 수 있는 값인가(§14.2-3) */
export const isDisplayable = (p: Param<unknown>) => p.verified;
