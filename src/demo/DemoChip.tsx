// 앱 모서리의 작은 "데모" 칩(§7.3) — 런처 복귀, 시연 초기화, 신청 다음 단계
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRepo } from '../data/context';
import type { ClaimAction, Actor } from '../domain';

const NEXT: Record<string, [ClaimAction, Actor]> = {
  SUBMITTED: ['VERIFY', 'SYSTEM'],
  VERIFIED: ['APPROVE', 'ADMIN'],
  PAYING: ['PAY', 'SYSTEM'],
};

export function DemoChip(props: { memberId: string; toast: (m: string) => void }) {
  const { t } = useTranslation();
  const repo = useRepo();
  const [open, setOpen] = useState(false);
  const next = async () => {
    setOpen(false);
    const v = await repo.getMember(props.memberId);
    const c = v.claims.find((x) => NEXT[x.status]);
    if (!c) return props.toast(t('demo.nextNone'));
    const [a, actor] = NEXT[c.status];
    await repo.transitionClaim(c.claim_id, a, actor);
    props.toast(t('demo.nextDone'));
  };
  const reset = async () => {
    setOpen(false);
    await repo.reset();
    props.toast(t('demo.resetDone'));
  };
  return (
    <div className="ui-demo-chip">
      <button type="button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)} aria-label={t('demo.menu')}>
        {t('demo.chip')}
      </button>
      {open && (
        <div className="ui-demo-menu" role="menu">
          <Link role="menuitem" to="/">
            {t('demo.launcher')}
          </Link>
          <button role="menuitem" type="button" onClick={next}>
            {t('demo.next')}
          </button>
          <button role="menuitem" type="button" onClick={reset}>
            {t('demo.reset')}
          </button>
        </div>
      )}
    </div>
  );
}
