// W-44 언어
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { LANGS, setLang } from '../../i18n';
import { useMember } from './WorkerApp';
import { WAppBar } from './parts';

export function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const { base, toast } = useMember();
  return (
    <>
      <WAppBar title={t('lang.title')} back={`${base}/me`} />
      <div className="ui-page">
        <p className="ui-sub" id="lang-lead">
          {t('lang.lead')}
        </p>
        <div className="ui-langlist" role="radiogroup" aria-labelledby="lang-lead">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="radio"
              lang={l.code}
              aria-checked={i18n.language === l.code}
              className="ui-langbtn"
              onClick={() => {
                setLang(l.code);
                toast(i18n.getFixedT(l.code)('lang.changed'));
              }}
            >
              <span>{l.native}</span>
              {i18n.language === l.code && <Check size={22} aria-hidden />}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
