// 사업주 포털(§8.3) — E-10 대시보드, E-20 근로자 상세, E-30 납부, E-40 신규 채용 자동 가입
import { useState } from 'react';
import { Link, Route, Routes, useParams } from 'react-router-dom';
import type { TFunction } from 'i18next';
import { CheckCircle2 } from 'lucide-react';
import {
  balance, clock, employerRateFor, formatDate, formatYM, npsApplicable, npsEmployerRate, policy, payStateOf, rateStepFor, yearOf,
  type ContributionBill,
} from '../../domain';
import { useQuery } from '../../data/context';
import { displayName } from '../../data/selectors';
import type { EmployerView, MemberView } from '../../data/repository';
import { Banner, Card, ChipGroup, DataTable, KPI, LineChart, StatusBadge, Timeline } from '../../ui';
import { Load } from '../shared/Load';
import { pct, won } from '../shared/Money';
import { PortalFrame, usePortalLang } from '../shared/portal';

const EMPLOYER_ID = 'EMP01';

interface Row {
  v: MemberView;
  bills: ContributionBill[];
  current: boolean;
  seq: number;
  latest: ContributionBill | undefined;
  nps: boolean;
}

function rowsOf(ev: EmployerView): Row[] {
  return ev.workers.map((v) => {
    const empIds = new Set(v.employments.filter((e) => e.employer_id === ev.employer.employer_id).map((e) => e.employment_id));
    const bills = v.bills.filter((b) => empIds.has(b.employment_id)).sort((a, b) => (a.ym < b.ym ? -1 : 1));
    const current = v.employments.some((e) => empIds.has(e.employment_id) && e.end_date === null) && v.member.status !== 'CLOSED';
    const all = [...v.bills].sort((a, b) => (a.ym < b.ym ? -1 : 1));
    return { v, bills, current, seq: all.at(-1)?.member_month_seq ?? 0, latest: bills.at(-1), nps: npsApplicable(v.person.nationality_iso2, policy).applicable };
  });
}

export function EmployerApp() {
  const [lang, setLang, t] = usePortalLang();
  const q = useQuery((r) => r.getEmployer(EMPLOYER_ID), []);
  return (
    <PortalFrame
      brand={t('portal.brand')}
      home="/e"
      lang={lang}
      setLang={setLang}
      t={t}
      nav={[
        { to: '/e', label: t('portal.nav.dashboard'), end: true },
        { to: '/e/bill', label: t('portal.nav.bill') },
        { to: '/e/hire', label: t('portal.nav.hire') },
      ]}
    >
      <Load q={q}>
        {(ev) => (
          <Routes>
            <Route index element={<Dashboard ev={ev} t={t} />} />
            <Route path="workers/:memberId" element={<WorkerDetail ev={ev} t={t} />} />
            <Route path="bill" element={<Bill ev={ev} t={t} />} />
            <Route path="hire" element={<Hire ev={ev} t={t} />} />
          </Routes>
        )}
      </Load>
    </PortalFrame>
  );
}

function Dashboard(props: { ev: EmployerView; t: TFunction }) {
  const { ev, t } = props;
  const rows = rowsOf(ev);
  const active = rows.filter((r) => r.current);
  const latestYm = clock.latestPaidYm();
  const year = yearOf(clock.today());
  const thisMonth = active.reduce((s, r) => s + (r.bills.find((b) => b.ym === latestYm)?.employer_amt ?? 0), 0);

  // 올해 차액: 국민연금 적용국 근로자만(§8.3). 비적용국 몫은 '신규 부담'
  const yearBills = (r: Row) => r.bills.filter((b) => yearOf(b.ym) === year);
  const npsRows = active.filter((r) => r.nps);
  const newRows = active.filter((r) => !r.nps);
  const saving = npsRows.reduce((s, r) => s + yearBills(r).reduce((a, b) => a + Math.floor(b.wage_krw * npsEmployerRate(year, policy)) - b.employer_amt, 0), 0);
  const newCost = newRows.reduce((s, r) => s + yearBills(r).reduce((a, b) => a + b.employer_amt, 0), 0);

  const years = Array.from({ length: 8 }, (_, i) => 2026 + i);
  const npsLine = years.map((y) => npsEmployerRate(y, policy) * 100);
  const ourLine = years.map((_, i) => employerRateFor(i * 12 + 6, policy) * 100);

  const feed: string[] = [];
  const paidCount = active.filter((r) => r.latest?.ym === latestYm && r.v.payments.some((p) => p.bill_id === r.latest!.bill_id)).length;
  feed.push(t('portal.e10.feedPaid', { ym: formatYM(latestYm), count: paidCount }));
  const unpaid = active.filter((r) => r.latest?.ym === latestYm && payStateOf(r.latest, r.v.payments.some((p) => p.bill_id === r.latest!.bill_id), clock.today()) === 'OVERDUE');
  if (unpaid.length) feed.unshift(t('portal.e10.feedUnpaid', { ym: formatYM(latestYm), names: unpaid.map((r) => displayName(r.v)).join(', '), date: formatDate(unpaid[0].latest!.due_date) }));
  for (const r of rows) {
    if (r.v.claims.some((c) => c.status !== "CANCELLED")) feed.push(t('portal.e10.feedClaim', { name: displayName(r.v) }));
    const first = r.bills[0];
    if (first && first.member_month_seq > 1) {
      const e = r.v.employments.find((x) => x.employment_id === first.employment_id)!;
      feed.push(t('portal.e10.feedMove', { name: displayName(r.v), date: formatDate(e.start_date) }));
    }
    const step = r.bills.find((b, i) => i > 0 && b.employer_rate !== r.bills[i - 1].employer_rate && yearOf(b.ym) >= year - 1);
    if (step) feed.push(t('portal.e10.feedStep', { name: displayName(r.v), rate: pct(step.employer_rate) }));
  }

  return (
    <>
      <div className="ui-row ui-row--wrap">
        <h1 className="ui-title-lg">{t('portal.e10.title', { name: ev.employer.name })}</h1>
        <StatusBadge tone="warning">{t('portal.demoData')}</StatusBadge>
      </div>
      <Banner tone="success">
        <p className="ui-strong">{t('portal.e10.zeroInput')}</p>
      </Banner>
      <div className="ui-kpis">
        <KPI label={t('portal.e10.thisMonth', { ym: formatYM(latestYm) })} value={won(thisMonth)} note={t('portal.e10.thisMonthNote')} />
        <KPI
          label={t('portal.e10.saving')}
          value={won(saving)}
          note={
            <>
              {t('portal.e10.savingNote', { count: npsRows.length })}
              {newRows.length > 0 && (
                <>
                  <br />
                  {t('portal.e10.newCost', { amount: won(newCost) })} — {t('portal.e10.newCostNote', { count: newRows.length })}
                </>
              )}
            </>
          }
        />
        <KPI label={t('portal.e10.headcount')} value={t('portal.e10.headcountValue', { count: active.length })} />
      </div>
      <div className="ui-cols">
        <Card>
          <h2 className="ui-strong">{t('portal.e10.compare')}</h2>
          <LineChart
            label={t('portal.e10.compare')}
            showLegend
            yFormat={(v) => `${v.toFixed(1)}%`}
            minY={0}
            height={180}
            xLabels={years.map(String)}
            series={[
              { name: t('portal.e10.compareNps'), color: '#6d7882', values: npsLine, dashed: true },
              { name: t('portal.e10.compareOurs'), color: 'var(--color-primary)', values: ourLine },
            ]}
          />
          <p className="ui-small ui-mt">{t('portal.e10.compareNote')}</p>
        </Card>
        <Card>
          <h2 className="ui-strong">{t('portal.e10.feed')}</h2>
          <ul className="ui-stack ui-stack--tight ui-mt ui-sub">
            {feed.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </Card>
      </div>
      <h2 className="ui-title">{t('portal.e10.workers')}</h2>
      <DataTable
        caption={t('portal.e10.workers')}
        rowKey={(r) => r.v.member.member_id}
        rows={active}
        columns={[
          { key: 'name', header: t('portal.e10.colName'), render: (r) => <Link to={`/e/workers/${r.v.member.member_id}`}>{displayName(r.v)}</Link> },
          { key: 'visa', header: t('portal.e10.colVisa'), render: (r) => r.v.visa.visa_type },
          { key: 'months', header: t('portal.e10.colMonths'), numeric: true, render: (r) => r.seq },
          { key: 'step', header: t('portal.e10.colStep'), numeric: true, render: (r) => `${pct(employerRateFor(Math.max(r.seq, 1), policy))}% (${rateStepFor(Math.max(r.seq, 1), policy)})` },
          { key: 'this', header: t('portal.e10.colThis'), numeric: true, render: (r) => won(r.bills.find((b) => b.ym === latestYm)?.employer_amt ?? 0) },
          { key: 'total', header: t('portal.e10.colTotal'), numeric: true, render: (r) => won(balance(r.v.ledger).total) },
        ]}
      />
    </>
  );
}

function WorkerDetail(props: { ev: EmployerView; t: TFunction }) {
  const { memberId } = useParams();
  const { t } = props;
  const r = rowsOf(props.ev).find((x) => x.v.member.member_id === memberId);
  if (!r) return <Banner tone="danger">{t('common.error')}</Banner>;
  const other = r.v.bills.length - r.bills.length;
  return (
    <>
      <Link to="/e">← {t('portal.e20.back')}</Link>
      <h1 className="ui-title-lg">{t('portal.e20.title', { name: displayName(r.v) })}</h1>
      <p className="ui-sub">{t('portal.e20.info', { months: r.bills.length, seq: r.seq })}</p>
      {other > 0 && <Banner tone="info">{t('portal.e20.otherEmployer', { count: other })}</Banner>}
      <DataTable
        caption={t('portal.e20.title', { name: displayName(r.v) })}
        rowKey={(b) => b.bill_id}
        rows={[...r.bills].reverse()}
        columns={[
          { key: 'ym', header: t('portal.e20.colYm'), render: (b) => formatYM(b.ym) },
          { key: 'wage', header: t('portal.e20.colWage'), numeric: true, render: (b) => won(b.wage_krw) },
          { key: 'seq', header: t('portal.e20.colSeq'), numeric: true, render: (b) => b.member_month_seq },
          { key: 'rate', header: t('portal.e20.colRate'), numeric: true, render: (b) => `${pct(b.employer_rate)}%` },
          { key: 'w', header: t('portal.e20.colWorker'), numeric: true, render: (b) => won(b.worker_amt) },
          { key: 'e', header: t('portal.e20.colEmployer'), numeric: true, render: (b) => won(b.employer_amt) },
          {
            key: 'st',
            header: t('portal.e20.colStatus'),
            render: (b) => {
              const st = payStateOf(b, r.v.payments.some((p) => p.bill_id === b.bill_id), clock.today());
              return <StatusBadge tone={st === 'PAID' ? 'success' : st === 'OVERDUE' ? 'danger' : 'neutral'}>{t(`home.pay.${st}`)}</StatusBadge>;
            },
          },
          { key: 'pd', header: t('portal.e20.colPaid'), render: (b) => formatDate(r.v.payments.find((p) => p.bill_id === b.bill_id)?.paid_at ?? b.due_date) },
        ]}
      />
    </>
  );
}

function Bill(props: { ev: EmployerView; t: TFunction }) {
  const { t } = props;
  const ym = clock.latestPaidYm();
  const bills = rowsOf(props.ev)
    .filter((r) => r.current)
    .map((r) => r.bills.find((b) => b.ym === ym))
    .filter((b): b is ContributionBill => !!b);
  const w = bills.reduce((s, b) => s + b.worker_amt, 0);
  const e = bills.reduce((s, b) => s + b.employer_amt, 0);
  const due = bills[0]?.due_date;
  const paidIds = new Set(rowsOf(props.ev).flatMap((r) => r.v.payments.map((p) => p.bill_id)));
  const overdue = bills.filter((b) => payStateOf(b, paidIds.has(b.bill_id), clock.today()) === 'OVERDUE');
  return (
    <>
      <h1 className="ui-title-lg">{t('portal.e30.title', { ym: formatYM(ym) })}</h1>
      <p className="ui-sub">{t('portal.e30.lead')}</p>
      <div className="ui-table-wrap">
        <table className="ui-table">
          <caption className="sr-only">{t('portal.e30.title', { ym: formatYM(ym) })}</caption>
          <thead>
            <tr>
              <th scope="col">{t('portal.e30.item')}</th>
              <th scope="col" className="ui-num">
                {t('portal.e30.amount')}
              </th>
              <th scope="col">{t('portal.e30.status')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                {t('portal.e30.existing')}
                <br />
                <span className="ui-small">{t('portal.e30.existingNote')}</span>
              </td>
              <td className="ui-num ui-muted">{t('portal.e30.unknown')}</td>
              <td>—</td>
            </tr>
            <tr>
              <td>
                <span className="ui-strong">{t('portal.e30.gongje')}</span> <StatusBadge tone="info">{t('coverage.st.new')}</StatusBadge>
                <br />
                <span className="ui-small">{t('portal.e30.gongjeNote', { worker: won(w), employer: won(e) })}</span>
              </td>
              <td className="ui-num ui-strong">{won(w + e)}</td>
              <td>
                {overdue.length ? (
                  <StatusBadge tone="danger">{t('portal.e30.overdue', { count: overdue.length })}</StatusBadge>
                ) : (
                  <StatusBadge tone="success">{t('home.pay.PAID')}</StatusBadge>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {due && <p className="ui-sub">{t('portal.e30.due', { date: formatDate(due) })}</p>}
      <Banner tone="success">
        <p className="ui-strong">{t('portal.e30.noExtra')}</p>
      </Banner>
    </>
  );
}

function Hire(props: { ev: EmployerView; t: TFunction }) {
  const { t } = props;
  const q = useQuery((r) => r.listMembers(), []);
  const [pick, setPick] = useState<string | null>(null);
  return (
    <>
      <h1 className="ui-title-lg">{t('portal.e40.title')}</h1>
      <p className="ui-sub">{t('portal.e40.lead')}</p>
      <Load q={q}>
        {(members) => {
          const v = members.find((m) => m.member.member_id === pick);
          const seq = v ? Math.max(...v.bills.map((b) => b.member_month_seq), 0) + 1 : 1;
          return (
            <>
              <Card>
                <p className="ui-strong">{t('portal.e40.pick')}</p>
                <div className="ui-mt">
                  <ChipGroup label={t('portal.e40.pick')} value={pick} onChange={setPick} options={members.map((m) => ({ value: m.member.member_id, label: <span className="num">{m.person.rid_masked}</span> }))} />
                </div>
              </Card>
              {v && (
                <Card>
                  <Timeline
                    label={t('portal.e40.title')}
                    items={[
                      { key: '1', title: t('portal.e40.step1'), desc: t('portal.e40.step1d'), state: 'done', stateLabel: t('status.state.done') },
                      { key: '2', title: t('portal.e40.step2'), desc: t('portal.e40.step2d', { seq }), state: 'done', stateLabel: t('status.state.done') },
                      { key: '3', title: t('portal.e40.step3'), desc: t('portal.e40.step3d', { rate: pct(employerRateFor(seq, policy)) }), state: 'done', stateLabel: t('status.state.done') },
                    ]}
                  />
                  <p className="ui-row ui-strong ui-mt">
                    <CheckCircle2 size={20} color="var(--color-success)" aria-hidden />
                    {t('portal.e40.result')}
                  </p>
                </Card>
              )}
            </>
          );
        }}
      </Load>
    </>
  );
}
