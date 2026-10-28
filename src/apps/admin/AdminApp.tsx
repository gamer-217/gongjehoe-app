// 운영자(§8.4) — A-10 기금 현황, A-20 환급 처리함, A-30 재정 시뮬레이터
import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import type { TFunction } from 'i18next';
import {
  availableActions, balance, clock, defaultFundParams, formatDate, fundSimConfig, ocbAt, simulateFund,
  type Claim, type ClaimAction, type FundParamKey, type RejectReason,
} from '../../domain';
import { useQuery, useRepo } from '../../data/context';
import { displayName } from '../../data/selectors';
import { BarChart, Banner, Button, Card, DataTable, KPI, LineChart, StatusBadge, Toast, type Tone } from '../../ui';
import { Load } from '../shared/Load';
import { pct, won } from '../shared/Money';
import { PortalFrame, usePortalLang } from '../shared/portal';


export function AdminApp() {
  const [lang, setLang, t] = usePortalLang();
  return (
    <PortalFrame
      brand={t('portal.adminBrand')}
      home="/a"
      lang={lang}
      setLang={setLang}
      t={t}
      nav={[
        { to: '/a', label: t('portal.nav.fund'), end: true },
        { to: '/a/claims', label: t('portal.nav.claims') },
        { to: '/a/sim', label: t('portal.nav.sim') },
      ]}
    >
      <Routes>
        <Route index element={<Fund t={t} />} />
        <Route path="claims" element={<Claims t={t} />} />
        <Route path="sim" element={<Sim t={t} />} />
      </Routes>
    </PortalFrame>
  );
}

function Fund(props: { t: TFunction }) {
  const { t } = props;
  const q = useQuery((r) => r.listMembers(), []);
  return (
    <Load q={q}>
      {(members) => {
        const thisYm = clock.today().slice(0, 7);
        const total = members.reduce((s, v) => s + balance(v.ledger).total, 0);
        const payouts = members.flatMap((v) => v.ledger.filter((e) => e.kind === 'PAYOUT' && e.ym === thisYm));
        const byCountry = new Map<string, number>();
        for (const v of members) byCountry.set(v.person.nationality_iso2, (byCountry.get(v.person.nationality_iso2) ?? 0) + balance(v.ledger).total);
        const status = new Map<string, number>();
        for (const v of members) status.set(v.member.status, (status.get(v.member.status) ?? 0) + 1);
        const divs = members[0]?.dividends ?? [];
        return (
          <>
            <div className="ui-row ui-row--wrap">
              <h1 className="ui-title-lg">{t('portal.a10.title')}</h1>
              <StatusBadge tone="warning">{t('portal.demoData')}</StatusBadge>
            </div>
            <div className="ui-kpis">
              <KPI label={t('portal.a10.members')} value={t('portal.a10.membersValue', { count: members.length })} />
              <KPI label={t('portal.a10.total')} value={won(total)} />
              <KPI label={t('portal.a10.refundMonth')} value={t('portal.a10.refundValue', { count: payouts.length, amount: won(Math.abs(payouts.reduce((s, e) => s + e.amount, 0))) })} />
              <KPI label={t('portal.a10.conversions')} value={t('portal.a10.conversionsValue', { count: status.get('CONVERTED') ?? 0 })} />
            </div>
            <div className="ui-cols">
              <Card>
                <h2 className="ui-strong">{t('portal.a10.byCountry')}</h2>
                <div className="ui-mt">
                  <BarChart
                    label={t('portal.a10.byCountry')}
                    rows={[...byCountry.entries()].sort((a, b) => b[1] - a[1]).map(([cc, v]) => ({ key: cc, label: t(`country.${cc}`), valueText: won(v), value: v }))}
                  />
                </div>
              </Card>
              <Card>
                <h2 className="ui-strong">{t('portal.a10.statusMix')}</h2>
                <ul className="ui-stack ui-stack--tight ui-mt ui-plainlist">
                  {[...status.entries()].map(([s, n]) => (
                    <li key={s} className="ui-row ui-row--between">
                      <span>{t(`me.st.${s}`)}</span>
                      <span className="ui-strong num">{n}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
            <h2 className="ui-title">{t('portal.a10.dividends')}</h2>
            <DataTable
              caption={t('portal.a10.dividends')}
              rowKey={(d) => String(d.year)}
              rows={[...divs].reverse()}
              columns={[
                { key: 'y', header: t('portal.a10.colYear'), render: (d) => d.year },
                { key: 'r', header: t('portal.a10.colRate'), numeric: true, render: (d) => `${pct(d.rate)}% (${t('common.demoDividend')})` },
                { key: 'd', header: t('portal.a10.colDeclared'), render: (d) => formatDate(d.declared_at) },
              ]}
            />
          </>
        );
      }}
    </Load>
  );
}

const claimTone: Record<Claim['status'], Tone> = { DRAFT: 'neutral', SUBMITTED: 'info', VERIFIED: 'info', PAYING: 'info', PAID: 'success', CANCELLED: 'neutral', REJECTED: 'danger' };
const ACTION_LABEL: Partial<Record<ClaimAction, string>> = { VERIFY: 'verify', APPROVE: 'approve', PAY: 'pay', REJECT: 'reject' };

function Claims(props: { t: TFunction }) {
  const { t } = props;
  const repo = useRepo();
  const q = useQuery(async (r) => ({ claims: await r.listClaims(), members: await r.listMembers() }), []);
  const [msg, setMsg] = useState<string | null>(null);
  const [reason, setReason] = useState<RejectReason>('NO_DEPARTURE_RECORD');
  const act = async (c: Claim, a: ClaimAction) => {
    await repo.transitionClaim(c.claim_id, a, 'ADMIN', a === 'REJECT' ? reason : undefined);
    setMsg(t('portal.a20.done'));
  };
  return (
    <>
      <h1 className="ui-title-lg">{t('portal.a20.title')}</h1>
      <Load q={q}>
        {({ claims, members }) =>
          claims.length === 0 ? (
            <Banner tone="info">{t('portal.a20.empty')}</Banner>
          ) : (
            <>
              <div className="ui-field">
                <label htmlFor="reason">{t('portal.a20.rejectReason')}</label>
                <select id="reason" className="ui-select" value={reason} onChange={(e) => setReason(e.target.value as RejectReason)}>
                  {(['NO_DEPARTURE_RECORD', 'ACCOUNT_MISMATCH', 'DUPLICATE'] as const).map((r) => (
                    <option key={r} value={r}>
                      {t(`status.reason.${r}`)}
                    </option>
                  ))}
                </select>
              </div>
              <DataTable
                caption={t('portal.a20.title')}
                rowKey={(c) => c.claim_id}
                rows={claims}
                columns={[
                  { key: 'id', header: t('portal.a20.colId'), render: (c) => <span className="num">{c.claim_id}</span> },
                  {
                    key: 'n',
                    header: t('portal.a20.colName'),
                    render: (c) => {
                      const v = members.find((m) => m.member.member_id === c.member_id);
                      return v ? displayName(v) : c.member_id;
                    },
                  },
                  { key: 'd', header: t('portal.a20.colDeparture'), render: (c) => formatDate(c.departure_date) },
                  { key: 'a', header: t('portal.a20.colAmount'), numeric: true, render: (c) => won(c.amount_snapshot) },
                  { key: 's', header: t('portal.a20.colStatus'), render: (c) => <StatusBadge tone={claimTone[c.status]}>{t(`status.s.${c.status}`)}</StatusBadge> },
                  {
                    key: 'x',
                    header: t('portal.a20.colAction'),
                    render: (c) => (
                      <div className="ui-row">
                        {(['VERIFY', 'APPROVE', 'PAY', 'REJECT'] as const)
                          .filter((a) => availableActions(c.status, 'ADMIN').includes(a))
                          .map((a) => (
                            <Button key={a} variant={a === 'REJECT' ? 'danger' : 'secondary'} onClick={() => act(c, a)}>
                              {t(`portal.a20.${ACTION_LABEL[a]}`)}
                            </Button>
                          ))}
                      </div>
                    ),
                  },
                ]}
              />
            </>
          )
        }
      </Load>
      <Toast message={msg} onDone={() => setMsg(null)} />
    </>
  );
}

function Sim(props: { t: TFunction }) {
  const { t } = props;
  const [p, setP] = useState(defaultFundParams);
  const { rows, breakeven } = simulateFund(p);
  const cfg = fundSimConfig;
  const last = rows.at(-1)!;
  return (
    <>
      <div className="ui-row ui-row--wrap">
        <h1 className="ui-title-lg">{t('portal.a30.title')}</h1>
        <StatusBadge tone="warning">{t('portal.a30.assumption')}</StatusBadge>
      </div>
      <p className="ui-sub">{t('portal.a30.lead')}</p>
      <div className="ui-kpis">
        <KPI label={t('portal.a30.fundEnd', { years: cfg.years })} value={`${last.fund.toLocaleString('en-US')}`} note={t('portal.a30.fund')} />
        <KPI label={t('portal.a30.breakeven')} value={breakeven ? t('portal.a30.breakevenValue', { year: breakeven }) : t('portal.a30.none')} />
        <KPI label={t('portal.a30.worstNet')} value={Math.min(...rows.map((r) => r.net)).toLocaleString('en-US')} />
        <KPI label={t('portal.a30.residents', { years: cfg.years })} value={last.residents.toLocaleString('en-US')} />
      </div>
      <div className="ui-cols">
        <Card>
          <h2 className="ui-strong">{t('portal.a30.fund')}</h2>
          <LineChart
            label={t('portal.a30.fund')}
            showLegend
            height={200}
            yFormat={(v) => v.toFixed(0)}
            xLabels={rows.map((r) => t('portal.a30.year', { n: r.year }))}
            series={[
              { name: t('portal.a30.fund'), color: 'var(--color-primary)', values: rows.map((r) => r.fund) },
              { name: t('portal.a30.ocb'), color: '#6d7882', dashed: true, values: rows.map((r) => ocbAt(r.year)) },
            ]}
          />
          <p className="ui-small ui-mt">{t('portal.a30.source', { source: cfg.source })}</p>
        </Card>
        <Card>
          <h2 className="ui-strong">{t('portal.a30.inputs')}</h2>
          <div className="ui-stack ui-mt">
            {(Object.keys(cfg.params) as FundParamKey[]).map((k) => {
              const c = cfg.params[k];
              return (
                <div key={k} className="ui-field">
                  <label htmlFor={`fs-${k}`} className="ui-row ui-row--between">
                    <span>{t(`portal.a30.p.${k}`)}</span>
                    <span className="num">
                      {p[k]} {t(`portal.a30.unit.${c.unit}`)}
                    </span>
                  </label>
                  <input id={`fs-${k}`} type="range" min={c.min} max={c.max} step={c.step} value={p[k]} onChange={(e) => setP({ ...p, [k]: Number(e.target.value) })} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
