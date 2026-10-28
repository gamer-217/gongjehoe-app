// W-10 홈(§8.2)
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Calculator, ShieldCheck } from 'lucide-react';
import { clock, formatDate, formatYM, policy } from '../../domain';
import { displayName } from '../../data/selectors';
import { Banner, Card, CardLink, HideAmountButton, ProgressRing, StatusBadge, type Tone } from '../../ui';
import { Money, won } from '../shared/Money';
import { useMember } from './WorkerApp';
import { WAppBar } from './parts';

const payTone: Record<string, Tone> = { PAID: 'success', PENDING: 'neutral', OVERDUE: 'danger' };

export function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { view, s, base, hidden, setHidden } = useMember();
  const maturity = policy.params.maturity_months.value;
  const latest = s.latestBill;
  const pay = latest && view.payments.find((p) => p.bill_id === latest.bill_id);

  const hi = view.notifications.find((n) => n.kind === 'HI_ARREARS');
  const div = view.notifications.filter((n) => n.kind === 'DIVIDEND' && !n.read).at(-1);
  const alerts: JSX.Element[] = [];
  if (s.openClaim)
    alerts.push(
      <Banner key="claim" tone="info" title={t('home.alerts.claimTitle')}>
        <p>{t('home.alerts.claimBody', { status: t(`status.s.${s.openClaim.status}`) })}</p>
        <Link to={`${base}/receive/status`}>{t('home.alerts.claimAction')}</Link>
      </Banner>,
    );
  if (view.member.status === 'CLOSED')
    alerts.push(
      <Banner key="closed" tone="success" title={t('home.alerts.closedTitle')}>
        <p>{t('home.alerts.closedBody')}</p>
      </Banner>,
    );
  if (hi)
    alerts.push(
      <Banner key="hi" tone="warning" title={t('home.alerts.hiArrearsTitle', { amount: won(Number(hi.payload.amount)) })}>
        <p>{t('home.alerts.hiArrearsBody')}</p>
      </Banner>,
    );
  if (view.nominees.length === 0 && view.member.status !== 'CLOSED')
    alerts.push(
      <Banner key="nom" tone="warning" title={t('home.alerts.nomineeTitle')}>
        <p>{t('home.alerts.nomineeBody')}</p>
        <Link to={`${base}/me/nominees`}>{t('home.alerts.nomineeAction')}</Link>
      </Banner>,
    );
  if (div)
    alerts.push(
      <Banner key="div" tone="info" title={t('home.alerts.dividendTitle', { year: div.payload.year })}>
        <p>{t('home.alerts.dividendBody', { amount: won(Number(div.payload.amount)) })}</p>
      </Banner>,
    );

  const name = displayName(view, i18n.language);
  return (
    <>
      <WAppBar title={t('common.appName')} />
      <div className="ui-page">
        <div>
          <p className="ui-title">{t('home.hello', { name })}</p>
          <p className="ui-small">{t('common.asOf', { date: formatDate(clock.today()) })}</p>
        </div>

        <Card variant="hero" labelledBy="total-h">
          <div className="ui-hero-top">
            <div className="ui-hero-top__main">
              <div className="ui-row">
                <h2 className="ui-sub ui-strong" id="total-h">
                  {t('home.total')}
                </h2>
                <span className="ui-spacer" />
                <HideAmountButton hidden={hidden} onToggle={() => setHidden(!hidden)} showLabel={t('common.showAmount')} hideLabel={t('common.hideAmount')} />
              </div>
              <Money value={s.total} size="xl" hidden={hidden} />
              <p className="ui-small">{s.maturity.matured ? t('home.matured') : t('home.toMaturity', { count: maturity - s.seq })}</p>
            </div>
            <ProgressRing
              ratio={s.maturity.ratio}
              full={s.maturity.matured}
              big={s.maturity.matured ? t('home.ringMatured') : String(s.seq)}
              small={s.maturity.matured ? t('common.months', { count: s.seq }) : t('home.ringSmall', { maturity })}
              label={s.maturity.matured ? t('home.matured') : t('home.ringLabel', { months: s.seq, maturity })}
            />
          </div>
          <div className="ui-grid-3 ui-mt" role="group" aria-label={t('home.parts.label')}>
            {(['worker', 'employer', 'dividend'] as const).map((k) => (
              <div className="ui-part" key={k}>
                <span className="ui-part__label">
                  <span className={`ui-dot ui-dot--${k}`} aria-hidden />
                  {t(`home.parts.${k}`)}
                </span>
                <Money value={s[k]} size="sm" hidden={hidden} />
              </div>
            ))}
          </div>
          <p className="ui-small ui-mt">{t('home.parts.note')}</p>
        </Card>

        {latest && s.latestPayState && (
          <Card labelledBy="pay-h">
            <div className="ui-card__head">
              <h2 className="ui-strong" id="pay-h">
                {t('home.pay.title', { ym: formatYM(latest.ym) })}
              </h2>
              <StatusBadge tone={payTone[s.latestPayState]}>{t(`home.pay.${s.latestPayState}`)}</StatusBadge>
            </div>
            <p className="ui-small">
              {s.latestPayState === 'PAID' && pay
                ? t('home.pay.paidDesc', { date: formatDate(pay.paid_at), worker: won(latest.worker_amt), employer: won(latest.employer_amt) })
                : s.latestPayState === 'PENDING'
                  ? t('home.pay.pendingDesc', { date: formatDate(latest.due_date) })
                  : t('home.pay.overdueDesc', { date: formatDate(latest.due_date) })}
            </p>
          </Card>
        )}

        {alerts.length > 0 && (
          <section className="ui-stack ui-stack--tight" aria-label={t('home.alerts.label')}>
            {alerts.slice(0, 2)}
          </section>
        )}

        <nav className="ui-grid-2" aria-label={t('home.quick.label')}>
          <CardLink to={`${base}/receive/simulate`}>
            <span className="ui-listrow__icon" aria-hidden>
              <Calculator size={22} />
            </span>
            <p className="ui-strong ui-mt">{t('home.quick.simulate')}</p>
          </CardLink>
          <CardLink to={`${base}/me/coverage`}>
            <span className="ui-listrow__icon" aria-hidden>
              <ShieldCheck size={22} />
            </span>
            <p className="ui-strong ui-mt">{t('home.quick.coverage')}</p>
          </CardLink>
        </nav>
      </div>
    </>
  );
}
