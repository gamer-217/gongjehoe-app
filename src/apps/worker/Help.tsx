// W-45 도움말 — 번호는 policy에서만(출처 확인된 것만)
import { useTranslation } from 'react-i18next';
import { Phone } from 'lucide-react';
import { policy } from '../../domain';
import { List } from '../../ui';
import { useMember } from './WorkerApp';
import { WAppBar } from './parts';

export function HelpScreen() {
  const { t } = useTranslation();
  const { base } = useMember();
  const P = policy.params;
  const lines = [
    { key: 'nps', p: P.nps_helpline },
    { key: 'foreign', p: P.foreign_helpline },
    { key: 'eps', p: P.eps_helpline },
  ].filter((l) => l.p.verified);
  return (
    <>
      <WAppBar title={t('help.title')} back={`${base}/me`} />
      <div className="ui-page">
        <h2 className="ui-section-title">{t('help.calls')}</h2>
        <List>
          {lines.map((l) => (
            <a key={l.key} className="ui-listrow" href={`tel:${l.p.value.replace(/-/g, '')}`}>
              <span className="ui-listrow__icon" aria-hidden>
                <Phone size={22} />
              </span>
              <span className="ui-listrow__body">
                <span className="ui-listrow__title">{t(`help.${l.key}`)}</span>
                <span className="ui-listrow__desc num">{l.p.value}</span>
              </span>
            </a>
          ))}
        </List>
        <h2 className="ui-section-title">{t('help.faq')}</h2>
        {[1, 2, 3, 4].map((i) => (
          <details key={i} className="ui-card ui-details">
            <summary>{t(`help.q${i}`)}</summary>
            <p className="ui-sub">{t(`help.a${i}`)}</p>
          </details>
        ))}
      </div>
    </>
  );
}
