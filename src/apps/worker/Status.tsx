// W-32 신청 현황 — 상태 타임라인(§6.2), 접수 상태면 취소(BR-10)
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList } from 'lucide-react';
import { canCancel, formatDate, type Claim, type ClaimStatus } from '../../domain';
import { useRepo } from '../../data/context';
import { Banner, BottomSheet, Button, ButtonLink, Card, EmptyState, StatusBadge, Timeline, type TimelineItem, type Tone } from '../../ui';
import { won } from '../shared/Money';
import { useMember } from './WorkerApp';
import { WAppBar } from './parts';
import { NpsNotice } from './NpsTrack';

const FLOW: ClaimStatus[] = ['SUBMITTED', 'VERIFIED', 'PAYING', 'PAID'];
const tone: Record<ClaimStatus, Tone> = {
  DRAFT: 'neutral', SUBMITTED: 'info', VERIFIED: 'info', PAYING: 'info', PAID: 'success', CANCELLED: 'neutral', REJECTED: 'danger',
};

function ClaimCard(props: { claim: Claim }) {
  const { t } = useTranslation();
  const repo = useRepo();
  const { view, toast } = useMember();
  const [ask, setAsk] = useState(false);
  const c = props.claim;
  const events = view.claimEvents.filter((e) => e.claim_id === c.claim_id);
  const at = (s: ClaimStatus) => events.find((e) => e.to_status === s)?.at;
  const payout = view.ledger.find((e) => e.kind === 'PAYOUT' && e.ref_id === c.claim_id);
  const idx = FLOW.indexOf(c.status);
  const ended = c.status === 'CANCELLED' || c.status === 'REJECTED';
  const lastDone = ended ? FLOW.indexOf(events.filter((e) => FLOW.includes(e.to_status)).at(-1)?.to_status ?? 'SUBMITTED') : idx;

  const items: TimelineItem[] = FLOW.map((s, i) => {
    const state: TimelineItem['state'] = ended
      ? i <= lastDone ? 'done' : i === lastDone + 1 ? 'bad' : 'todo'
      : i <= idx ? 'done' : i === idx + 1 ? 'current' : 'todo';
    const when = at(s);
    const desc = state === 'done'
      ? [when ? formatDate(when) : null, s === 'PAID' && payout ? t('status.d.PAID', { amount: won(-payout.amount) }) : t(`status.d.${s}`)].filter(Boolean).join(' · ')
      : undefined;
    return { key: s, title: state === 'bad' ? t(`status.s.${c.status}`) : t(`status.s.${s}`), desc, state, stateLabel: t(`status.state.${state}`) };
  });

  const cancel = async () => {
    await repo.transitionClaim(c.claim_id, 'CANCEL', 'WORKER');
    setAsk(false);
    toast(t('status.cancelled'));
  };

  return (
    <Card>
      <div className="ui-card__head">
        <h2 className="ui-strong">{t('status.departure', { date: formatDate(c.departure_date) })}</h2>
        <StatusBadge tone={tone[c.status]}>{t(`status.s.${c.status}`)}</StatusBadge>
      </div>
      <p className="ui-small">{t('status.snapshot', { amount: won(c.amount_snapshot) })}</p>
      <div className="ui-mt">
        <Timeline items={items} label={t('status.timeline')} />
      </div>
      {c.status === 'REJECTED' && c.reject_reason && (
        <Banner tone="danger">
          <p>{t('status.rejected', { reason: t(`status.reason.${c.reject_reason}`) })}</p>
        </Banner>
      )}
      {canCancel(c.status) && (
        <div className="ui-mt">
          <Button variant="danger" block onClick={() => setAsk(true)}>
            {t('status.cancel')}
          </Button>
        </div>
      )}
      <BottomSheet open={ask} onClose={() => setAsk(false)} title={t('status.cancelQ')} closeLabel={t('common.close')}>
        <p>{t('status.cancelBody')}</p>
        <Button variant="danger" block onClick={cancel}>
          {t('status.cancelYes')}
        </Button>
        <Button variant="secondary" block onClick={() => setAsk(false)}>
          {t('common.cancel')}
        </Button>
      </BottomSheet>
    </Card>
  );
}

export function StatusScreen() {
  const { t } = useTranslation();
  const { s, base } = useMember();
  if (s.track !== 'FUND') return <NpsNotice title={t('status.title')} back={`${base}/receive`} />;
  return <FundStatusScreen />;
}

function FundStatusScreen() {
  const { t } = useTranslation();
  const { view, base } = useMember();
  const claims = [...view.claims].reverse();
  const [current, ...past] = claims;
  return (
    <>
      <WAppBar title={t('status.title')} back={`${base}/receive`} />
      <div className="ui-page">
        {!current ? (
          <EmptyState icon={<ClipboardList size={40} aria-hidden />} title={t('status.empty')}>
            <ButtonLink to={`${base}/receive/apply`}>{t('status.goApply')}</ButtonLink>
          </EmptyState>
        ) : (
          <>
            <ClaimCard claim={current} />
            {past.length > 0 && <h2 className="ui-section-title">{t('status.history')}</h2>}
            {past.map((c) => (
              <ClaimCard key={c.claim_id} claim={c} />
            ))}
          </>
        )}
      </div>
    </>
  );
}
