// BR-23(B안): 국민연금 적용국 근로자 화면 — 공제회 적립 대신 국민연금 반환일시금 안내(앱은 안내·창구 역할)
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Landmark, Phone, ShieldCheck } from 'lucide-react';
import { addMonths, clock, formatDate, npsLumpSumEstimate, policy } from '../../domain';
import { displayName } from '../../data/selectors';
import { Banner, Card, CardLink, ChipGroup, List, StatusBadge } from '../../ui';
import { Money } from '../shared/Money';
import { useMember } from './WorkerApp';
import { WAppBar } from './parts';

function CallNps() {
  const { t } = useTranslation();
  const n = policy.params.nps_helpline;
  if (!n.verified) return null;
  return (
    <List>
      <a className="ui-listrow" href={`tel:${n.value}`}>
        <span className="ui-listrow__icon" aria-hidden>
          <Phone size={22} />
        </span>
        <span className="ui-listrow__body">
          <span className="ui-listrow__title">{t('nps.call')}</span>
          <span className="ui-listrow__desc num">{n.value}</span>
        </span>
      </a>
    </List>
  );
}

/** W-10 대체: 국민연금 대상 근로자 홈 */
export function NpsHome() {
  const { t, i18n } = useTranslation();
  const { view, s, base, hidden } = useMember();
  return (
    <>
      <WAppBar title={t('common.appName')} />
      <div className="ui-page">
        <div>
          <p className="ui-title">{t('home.hello', { name: displayName(view, i18n.language) })}</p>
          <p className="ui-small">{t('common.asOf', { date: formatDate(clock.today()) })}</p>
        </div>
        <Card variant="hero" labelledBy="nps-h">
          <div className="ui-card__head">
            <h2 className="ui-title" id="nps-h">
              {t('nps.homeTitle')}
            </h2>
            <StatusBadge tone="info">{t('nps.badge')}</StatusBadge>
          </div>
          <p className="ui-sub">{t('nps.homeBody')}</p>
          <div className="ui-row ui-row--between ui-row--wrap ui-mt">
            <span className="ui-sub">{t('nps.estimate')}</span>
            <Money value={s.npsEstimate.total} size="lg" hidden={hidden} />
          </div>
          <p className="ui-small ui-mt">{t('nps.estimateNote')}</p>
        </Card>
        <Card labelledBy="nps-how">
          <h2 className="ui-strong" id="nps-how">
            {t('nps.howTitle')}
          </h2>
          <p className="ui-sub ui-mt">{t('nps.how')}</p>
        </Card>
        <CallNps />
        <CardLink to={`${base}/me/coverage`}>
          <span className="ui-listrow__icon" aria-hidden>
            <ShieldCheck size={22} />
          </span>
          <p className="ui-strong ui-mt">{t('home.quick.coverage')}</p>
        </CardLink>
      </div>
    </>
  );
}

/** 공제회 전용 화면(내역·환급 신청·현황·전환·수급권자)에 들어온 국민연금 대상 근로자에게 */
export function NpsNotice(props: { title: string; back?: string }) {
  const { t } = useTranslation();
  return (
    <>
      <WAppBar title={props.title} back={props.back} />
      <div className="ui-page">
        <Banner tone="info" title={t('nps.notFund')}>
          <p>{t('nps.notFundBody')}</p>
        </Banner>
        <CallNps />
      </div>
    </>
  );
}

/** W-30 대체: 귀국하면 받는 국민연금(원금 약식) */
export function NpsSimulator() {
  const { t } = useTranslation();
  const { view, s, base } = useMember();
  const [months, setMonths] = useState(0);
  const last = clock.latestPaidYm();
  const wages = [
    ...view.wageReports.filter((w) => w.ym <= last).map((w) => ({ ym: w.ym, wage: w.wage_krw })),
    ...Array.from({ length: months }, (_, i) => ({ ym: addMonths(last, i + 1), wage: s.lastReportedWage })),
  ];
  const est = npsLumpSumEstimate({ nationality_iso2: view.person.nationality_iso2, wages }, policy);
  return (
    <>
      <WAppBar title={t('nps.simTitle')} back={`${base}/receive`} />
      <div className="ui-page">
        <h2 className="ui-strong">{t('sim.question')}</h2>
        <ChipGroup
          label={t('sim.question')}
          value={months}
          onChange={setMonths}
          options={[
            { value: 0, label: t('sim.now') },
            { value: 6, label: t('sim.m6') },
            { value: 12, label: t('sim.m12') },
          ]}
        />
        <Card>
          <div className="ui-row ui-row--between ui-row--wrap">
            <span>{t('sim.nps')}</span>
            <Money value={est.total} size="xl" />
          </div>
          {months > 0 && (
            <p className="ui-small ui-mt">
              <StatusBadge tone="warning">{t('common.example')}</StatusBadge> {t('nps.simNote')}
            </p>
          )}
          <p className="ui-small ui-mt">{t('nps.estimateNote')}</p>
        </Card>
        <Banner tone="info">
          <p>{t('nps.how')}</p>
        </Banner>
        <CallNps />
      </div>
    </>
  );
}

/** 받기 탭(국민연금 대상) */
export function NpsReceiveHub() {
  const { t } = useTranslation();
  const { base } = useMember();
  return (
    <>
      <WAppBar title={t('receive.title')} />
      <div className="ui-page">
        <CardLink to={`${base}/receive/simulate`}>
          <span className="ui-listrow__icon" aria-hidden>
            <Landmark size={22} />
          </span>
          <p className="ui-strong ui-mt">{t('nps.simTitle')}</p>
        </CardLink>
        <Banner tone="info" title={t('nps.homeTitle')}>
          <p>{t('nps.how')}</p>
        </Banner>
        <CallNps />
      </div>
    </>
  );
}
