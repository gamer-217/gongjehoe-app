// W-43 보장 지도 — 지금 지키는 것 / 떠날 때 받는 것 / 비어 있는 자리
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, HeartPulse, PiggyBank, ShieldAlert } from 'lucide-react';
import { coverageMap, policy, type CoverageItem } from '../../domain';
import { StatusBadge, type Tone } from '../../ui';
import { pct } from '../shared/Money';
import { useMember } from './WorkerApp';
import { WAppBar } from './parts';

const stTone: Record<CoverageItem['status'], Tone> = { on: 'success', opt: 'warning', x: 'neutral', new: 'info' };
const groupIcon = { now: HeartPulse, leave: PiggyBank, gap: ShieldAlert };

export function CoverageScreen() {
  const { t } = useTranslation();
  const { view, base } = useMember();
  const map = coverageMap(view.person, policy);
  const [open, setOpen] = useState<string | null>(null);
  const P = policy.params;
  const vars = {
    worker: pct(P.worker_rate.value),
    employer: P.employer_rate_steps.value.map((s) => `${pct(s.rate)}%`).join('→'),
    rate: pct(P.departure_insurance_rate.value),
    years: P.nps_min_years.value,
  };
  return (
    <>
      <WAppBar title={t('coverage.title')} back={`${base}/me`} />
      <div className="ui-page">
        <p className="ui-sub">{t('coverage.lead')}</p>
        {(['now', 'leave', 'gap'] as const).map((g) => {
          const Icon = groupIcon[g];
          return (
            <section key={g} aria-labelledby={`cg-${g}`} className="ui-stack ui-stack--tight">
              <h2 className="ui-section-title ui-row" id={`cg-${g}`}>
                <Icon size={18} aria-hidden />
                {t(`coverage.group.${g}`)}
              </h2>
              <div className="ui-list">
                {map[g].map((it) => {
                  const k = `coverage.items.${it.key}`;
                  const isOpen = open === it.key;
                  return (
                    <div key={it.key}>
                      <button type="button" className="ui-listrow" aria-expanded={isOpen} aria-controls={`cd-${it.key}`} onClick={() => setOpen(isOpen ? null : it.key)}>
                        <span className="ui-listrow__body">
                          <span className="ui-listrow__title">{t(`${k}.name`)}</span>
                          <span className="ui-listrow__desc">{t(`${k}.line`)}</span>
                        </span>
                        <span className="ui-listrow__end">
                          <StatusBadge tone={stTone[it.status]}>{t(`coverage.st.${it.status}`)}</StatusBadge>
                          {isOpen ? <ChevronUp size={20} aria-hidden /> : <ChevronDown size={20} aria-hidden />}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="ui-cov-detail" id={`cd-${it.key}`}>
                          <p>{t(`${k}.detail`, vars)}</p>
                          <dl>
                            <dt>{t('coverage.payer')}</dt>
                            <dd>{t(`${k}.payer`)}</dd>
                            <dt>{t('coverage.where')}</dt>
                            <dd>{t(`${k}.where`)}</dd>
                          </dl>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
