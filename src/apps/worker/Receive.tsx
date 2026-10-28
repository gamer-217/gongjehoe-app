// 받기 탭 허브, W-30 귀국 시 받는 돈(§8.2)
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, ClipboardList, Plane, Repeat } from 'lucide-react';
import { addMonths, clock, formatYM, horizonChips, npsEmployerRate, yearOf, npsLumpSumEstimate, policy, project } from '../../domain';
import { BarChart, Card, ChipGroup, Legend, List, ListRow, StatusBadge } from '../../ui';
import { Money, pct, won } from '../shared/Money';
import { useMember } from './WorkerApp';
import { WAppBar } from './parts';

export function ReceiveHub() {
  const { t } = useTranslation();
  const { base, s } = useMember();
  return (
    <>
      <WAppBar title={t('receive.title')} />
      <div className="ui-page">
        <List>
          <ListRow to={`${base}/receive/simulate`} icon={<Calculator size={22} aria-hidden />} title={t('receive.simulate')} desc={t('receive.simulateDesc')} chevron />
          <ListRow to={`${base}/receive/apply`} icon={<Plane size={22} aria-hidden />} title={t('receive.apply')} desc={t('receive.applyDesc')} chevron />
          <ListRow
            to={`${base}/receive/status`}
            icon={<ClipboardList size={22} aria-hidden />}
            title={t('receive.status')}
            desc={t('receive.statusDesc')}
            end={s.openClaim ? <StatusBadge tone="info">{t(`status.s.${s.openClaim.status}`)}</StatusBadge> : undefined}
            chevron
          />
          <ListRow to={`${base}/receive/convert`} icon={<Repeat size={22} aria-hidden />} title={t('receive.convert')} desc={t('receive.convertDesc')} chevron />
        </List>
      </div>
    </>
  );
}

export function SimulatorScreen() {
  const { t } = useTranslation();
  const { view, s, base } = useMember();
  const chips = horizonChips(s.seq, policy);
  const [months, setMonths] = useState(0);
  const rate = policy.params.projection_rate.value;
  const p = project({ confirmedTotal: s.total, lastWage: s.lastWage, lastSeq: s.seq, lastYm: s.latestBill?.ym ?? view.member.joined_ym }, months, policy);
  const extra = p.total - p.confirmed;

  // 국민연금 반환일시금 약식: 지금까지 월 보수 + 앞으로 같은 월급
  const lastYm = s.latestBill?.ym ?? view.member.joined_ym;
  const wages = [
    // 비교는 같은 조건으로: 실제 수납된 달만(미납 달은 국민연금도 미납으로 본다)
    ...view.bills.filter((b) => view.payments.some((p) => p.bill_id === b.bill_id)).map((b) => ({ ym: b.ym, wage: b.wage_krw })),
    ...Array.from({ length: months }, (_, i) => ({ ym: addMonths(lastYm, i + 1), wage: s.lastWage })),
  ];
  const nps = npsLumpSumEstimate({ nationality_iso2: view.person.nationality_iso2, wages }, policy);

  const steps = policy.params.employer_rate_steps.value.map((x) => `${pct(x.rate)}%`).join('→');
  const chipLabel = (k: string, m: number) => (k === 'maturity' ? t('sim.maturity', { count: policy.params.maturity_months.value }) : k === 'now' ? t('sim.now') : t(`sim.${k}`, { count: m }));

  return (
    <>
      <WAppBar title={t('sim.title')} back={`${base}/receive`} />
      <div className="ui-page">
        <h2 className="ui-strong" id="when-q">
          {t('sim.question')}
        </h2>
        <ChipGroup label={t('sim.question')} value={months} onChange={setMonths} options={chips.map((c) => ({ value: c.months, label: chipLabel(c.key, c.months) }))} />

        <Card labelledBy="sim-res">
          <h3 className="ui-sub ui-strong" id="sim-res">
            {t('sim.result', { ym: formatYM(p.untilYm) })}
          </h3>
          <div className="ui-row ui-row--between ui-mt">
            <span>{months === 0 ? t('sim.totalNow') : t('sim.total')}</span>
            <Money value={p.total} size="xl" />
          </div>
          <dl className="ui-kv ui-mt">
            <dt>{t('sim.confirmed')}</dt>
            <dd>
              <Money value={p.confirmed} size="sm" />
            </dd>
            {months > 0 && (
              <>
                <dt>
                  {t('sim.expected')} <StatusBadge tone="warning">{t('common.example')}</StatusBadge>
                </dt>
                <dd>
                  <Money value={extra} size="sm" sign />
                </dd>
              </>
            )}
          </dl>
          {months > 0 && <p className="ui-small ui-mt">{t('sim.expectedNote', { rate: pct(rate) })}</p>}
        </Card>

        <Card labelledBy="cmp-h">
          <h3 className="ui-strong" id="cmp-h">
            {t('sim.compare')}
          </h3>
          <div className="ui-mt">
            {nps.applicable ? (
              <>
                <BarChart
                  label={t('sim.compare')}
                  rows={[
                    { key: 'ours', label: t('sim.ours'), valueText: won(p.total), value: p.confirmed, extra: Math.max(extra, 0) },
                    { key: 'nps', label: t('sim.nps'), valueText: won(nps.total), value: nps.total, tone: 'gray' },
                  ]}
                />
                {months > 0 && <Legend items={[{ label: t('sim.confirmed'), color: 'var(--color-primary)' }, { label: `${t('sim.expected')} (${t('common.example')})`, hatch: true }]} />}
                <p className="ui-small ui-mt">{t('sim.npsNote')}</p>
              </>
            ) : (
              <>
                <BarChart label={t('sim.compare')} rows={[{ key: 'ours', label: t('sim.ours'), valueText: won(p.total), value: p.confirmed, extra: Math.max(extra, 0) }]} />
                <p className="ui-sub ui-mt">{t('sim.npsNone')}</p>
              </>
            )}
          </div>
        </Card>

        <details className="ui-card ui-details">
          <summary>{t('sim.how')}</summary>
          <ul>
            <li>{t('sim.how1')}</li>
            <li>{t('sim.how2', { worker: pct(policy.params.worker_rate.value), steps })}</li>
            <li>{t('sim.how3', { rate: pct(rate) })}</li>
            {nps.applicable && <li>{t('sim.how4')}</li>}
            {nps.applicable && <li>{t('sim.how5', { nps: pct(npsEmployerRate(yearOf(clock.today()), policy)), worker: pct(policy.params.worker_rate.value), steps })}</li>}
          </ul>
        </details>
      </div>
    </>
  );
}

