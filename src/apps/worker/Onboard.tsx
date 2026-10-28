// W-01 언어 선택(첫 실행) — 10초 안에 자기 언어로(§8.2)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, PiggyBank } from 'lucide-react';
import { useQuery } from '../../data/context';
import { LANGS, setLang, storedLang } from '../../i18n';
import type { Lang } from '../../domain';
import { Button } from '../../ui';

export function Onboard(props: { memberId: string }) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const q = useQuery((r) => r.getMember(props.memberId), [props.memberId]);
  const [lang, pick] = useState<Lang | null>(storedLang());
  useEffect(() => {
    if (!lang && q.status === 'ok') {
      pick(q.data.member.lang);
      setLang(q.data.member.lang);
    }
  }, [q.status]); // eslint-disable-line react-hooks/exhaustive-deps
  const choose = (l: Lang) => {
    pick(l);
    setLang(l);
  };
  return (
    <div className="ui-mobile">
      <main className="ui-page ui-page--plain">
        <div className="ui-intro">
          <span className="ui-listrow__icon" aria-hidden>
            <PiggyBank size={24} />
          </span>
          <h1 className="ui-title-lg">{t('common.appName')}</h1>
          <p className="ui-sub">{t('onboard.promise')}</p>
        </div>
        <h2 className="ui-section-title" id="lang-q">
          {t('onboard.chooseLang')}
        </h2>
        <div className="ui-langlist" role="radiogroup" aria-labelledby="lang-q">
          {LANGS.map((l) => (
            <button key={l.code} type="button" role="radio" lang={l.code} aria-checked={lang === l.code} className="ui-langbtn" onClick={() => choose(l.code)}>
              <span>{l.native}</span>
              {lang === l.code && <Check size={22} aria-hidden />}
            </button>
          ))}
        </div>
        <Button block onClick={() => nav(`/w/${props.memberId}`)} disabled={!lang}>
          {t('onboard.start')}
        </Button>
      </main>
    </div>
  );
}
