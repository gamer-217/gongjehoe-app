// W-31 환급 신청 — EPF가 앱으로 못 하는 흐름(§2.4, §8.2)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Landmark, Plus } from 'lucide-react';
import { addDays, clock, departureWindow, formatDate, formatYM, policy, type ISODate } from '../../domain';
import { useRepo } from '../../data/context';
import { Banner, Button, ButtonLink, Calendar, Card, ChipGroup, List, ListRow, Stepper } from '../../ui';
import { Money } from '../shared/Money';
import { useMember } from './WorkerApp';
import { SecureSheet, WAppBar } from './parts';

type Step = 1 | 2 | 3 | 'done';

export function ApplyScreen() {
  const { t } = useTranslation();
  const repo = useRepo();
  const nav = useNavigate();
  const { view, s, base } = useMember();
  const today = clock.today();
  const win = departureWindow(today, policy);
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<'w2' | 'm1' | 'pick' | null>(null);
  const [date, setDate] = useState<ISODate | null>(null);
  const [acct, setAcct] = useState<string | null>(s.activeAccount?.id ?? null);
  const [agree, setAgree] = useState(false);
  const [secure, setSecure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (step !== 'done' && s.openClaim)
    return (
      <>
        <WAppBar title={t('apply.title')} back={`${base}/receive`} />
        <div className="ui-page">
          <Banner tone="info" title={t('apply.openExists')}>
            <p>{t(`status.s.${s.openClaim.status}`)}</p>
          </Banner>
          <ButtonLink to={`${base}/receive/status`} block>
            {t('apply.goStatus')}
          </ButtonLink>
        </div>
      </>
    );
  if (step !== 'done' && view.member.status === 'CLOSED')
    return (
      <>
        <WAppBar title={t('apply.title')} back={`${base}/receive`} />
        <div className="ui-page">
          <Banner tone="success" title={t('apply.closed')} />
        </div>
      </>
    );

  const pickQuick = (m: 'w2' | 'm1' | 'pick') => {
    setMode(m);
    if (m === 'w2') setDate(addDays(today, 14));
    else if (m === 'm1') setDate(win.max);
    else setDate(null);
  };
  const account = view.bankAccounts.find((a) => a.id === acct);

  const submit = async () => {
    if (!date || !acct) return;
    setBusy(true);
    setErr(null);
    try {
      await repo.submitClaim({ memberId: view.member.member_id, departure_date: date, bank_account_id: acct });
      setSecure(false);
      setStep('done');
    } catch {
      setErr(t('apply.error'));
      setSecure(false);
    } finally {
      setBusy(false);
    }
  };

  const nowText = step === 1 ? t('apply.step1') : step === 2 ? t('apply.step2') : step === 3 ? (secure ? t('apply.step4') : t('apply.step3')) : '';
  const back = step === 1 || step === 'done' ? `${base}/receive` : undefined;

  return (
    <>
      <WAppBar title={t('apply.title')} back={back} />
      <div className="ui-page">
        {step !== 'done' && <Stepper current={secure ? 4 : step} total={4} nowText={nowText} progressLabel={t('apply.progress')} />}

        {step === 1 && (
          <>
            <h2 className="ui-title" id="date-q">
              {t('apply.dateQ')}
            </h2>
            <ChipGroup
              label={t('apply.dateQ')}
              value={mode}
              onChange={pickQuick}
              options={[
                { value: 'w2', label: t('apply.in2w') },
                { value: 'm1', label: t('apply.in1m') },
                { value: 'pick', label: t('apply.pick') },
              ]}
            />
            {mode === 'pick' && (
              <Card>
                <Calendar
                  min={win.min}
                  max={win.max}
                  value={date}
                  onChange={setDate}
                  dow={t('cal.dow', { returnObjects: true }) as string[]}
                  monthLabel={(ym) => t('cal.month', { ym: formatYM(ym) })}
                  prevLabel={t('apply.prevMonth')}
                  nextLabel={t('apply.nextMonth')}
                  dayLabel={(d) => formatDate(d)}
                />
              </Card>
            )}
            {date && (
              <p className="ui-strong" aria-live="polite">
                {t('apply.selected', { date: formatDate(date) })}
              </p>
            )}
            <p className="ui-small">{t('apply.windowNote', { days: policy.params.claim_window_days.value })}</p>
            <Banner tone="info">
              <p>{t('apply.noDocs')}</p>
            </Banner>
            <Button block disabled={!date} onClick={() => setStep(2)}>
              {t('common.next')}
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="ui-title">{t('apply.accountQ')}</h2>
            {view.bankAccounts.length === 0 && <Banner tone="warning">{t('apply.noAccount')}</Banner>}
            <div className="ui-chips ui-stack" role="radiogroup" aria-label={t('apply.accountQ')}>
              {view.bankAccounts.map((a) => (
                <button key={a.id} type="button" role="radio" aria-checked={acct === a.id} className="ui-langbtn" onClick={() => setAcct(a.id)}>
                  <span className="ui-row">
                    <Landmark size={22} aria-hidden />
                    <span>
                      <span className="ui-listrow__title">{a.bank_name}</span>
                      <span className="ui-listrow__desc num">
                        {a.account_masked} · {a.currency}
                      </span>
                    </span>
                  </span>
                  {acct === a.id && <CheckCircle2 size={22} aria-hidden />}
                </button>
              ))}
            </div>
            <List>
              <ListRow to={`${base}/me/accounts`} icon={<Plus size={22} aria-hidden />} title={t('apply.addAccount')} chevron />
            </List>
            <div className="ui-grid-2">
              <Button variant="secondary" onClick={() => setStep(1)}>
                {t('common.back')}
              </Button>
              <Button disabled={!acct} onClick={() => setStep(3)}>
                {t('common.next')}
              </Button>
            </div>
          </>
        )}

        {step === 3 && date && account && (
          <>
            <h2 className="ui-title">{t('apply.summary')}</h2>
            <Card>
              <dl className="ui-kv">
                <dt>{t('apply.amount')}</dt>
                <dd>
                  <Money value={s.total} size="lg" />
                </dd>
                <dt>{t('apply.account')}</dt>
                <dd>
                  {account.bank_name}
                  <br />
                  <span className="num">{account.account_masked}</span>
                </dd>
                <dt>{t('apply.date')}</dt>
                <dd className="num">{formatDate(date)}</dd>
              </dl>
              <p className="ui-small ui-mt">{t('apply.amountNote')}</p>
            </Card>
            <label className="ui-check">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>{t('apply.agree')}</span>
            </label>
            {err && <Banner tone="danger" role="alert">{err}</Banner>}
            <div className="ui-grid-2">
              <Button variant="secondary" onClick={() => setStep(2)}>
                {t('common.back')}
              </Button>
              <Button disabled={!agree} onClick={() => setSecure(true)}>
                {t('apply.submit')}
              </Button>
            </div>
            <SecureSheet open={secure} onClose={() => setSecure(false)} onConfirm={submit} busy={busy} />
          </>
        )}

        {step === 'done' && (
          <>
            <div className="ui-intro">
              <CheckCircle2 size={56} color="var(--color-success)" aria-hidden />
              <h2 className="ui-title-lg" tabIndex={-1} ref={(el) => el?.focus()}>
                {t('apply.doneTitle')}
              </h2>
            </div>
            <Card>
              <p className="ui-strong">{t('apply.doneLead')}</p>
              <ol className="ui-stack ui-stack--tight ui-mt">
                <li>{t('apply.done1')}</li>
                <li>{t('apply.done2')}</li>
                <li>{t('apply.done3', { days: policy.params.payout_target_business_days.value })}</li>
              </ol>
            </Card>
            <Button block onClick={() => nav(`${base}/receive/status`)}>
              {t('apply.goStatus')}
            </Button>
          </>
        )}
      </div>
    </>
  );
}
