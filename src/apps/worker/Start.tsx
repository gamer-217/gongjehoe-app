// 앱 시작 흐름 — 스플래시 → (처음) 언어 선택 → 소개 3장 → 로그인 → 홈 / (다음부터) 스플래시 → 홈
// 실제 본인인증은 실서비스 단계(§13). 시연에서는 시연 계정을 골라 로그인한다
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChevronRight, PiggyBank, Plane, Repeat } from 'lucide-react';
import { policy, type Lang } from '../../domain';
import { useQuery } from '../../data/context';
import { displayName } from '../../data/selectors';
import { LANGS, setLang, storedLang } from '../../i18n';
import { Button, List } from '../../ui';
import { pct } from '../shared/Money';
import { isStudy } from '../shared/study';

const SESSION = 'gongjehoe.session';
const INTRO_SEEN = 'gongjehoe.introSeen';

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    // 저장 실패 — 이번 실행 동안만 유지
  }
};

export const session = {
  get: () => read(SESSION),
  set: (memberId: string) => write(SESSION, memberId),
  clear: () => write(SESSION, null),
};

type Step = 'splash' | 'lang' | 'intro' | 'login';

export function AppStart() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>('splash');

  useEffect(() => {
    if (step !== 'splash') return;
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(
      () => {
        const id = session.get();
        if (id) nav(`/w/${id}`, { replace: true });
        else if (!storedLang()) setStep('lang');
        else if (!read(INTRO_SEEN)) setStep('intro');
        else setStep('login');
      },
      reduce ? 300 : 1100,
    );
    return () => clearTimeout(t);
  }, [step, nav]);

  return (
    <div className="ui-mobile ui-start">
      {step !== 'splash' && <StartHead />}
      {step === 'splash' && <Splash />}
      {step === 'lang' && <LangStep onDone={() => setStep(read(INTRO_SEEN) ? 'login' : 'intro')} />}
      {step === 'intro' && (
        <Intro
          onDone={() => {
            write(INTRO_SEEN, '1');
            setStep('login');
          }}
        />
      )}
      {step === 'login' && <Login onLogin={(id) => nav(`/w/${id}`, { replace: true })} />}
    </div>
  );
}

// 언어·소개·로그인 화면 위 보라 머리: 앱 표시와 이름
function StartHead() {
  const { t } = useTranslation();
  return (
    <header className="ui-start__head">
      <span className="ui-start__logo" aria-hidden>
        <PiggyBank size={24} />
      </span>
      <span className="ui-start__name">{t('common.appName')}</span>
    </header>
  );
}

function Splash() {
  const { t } = useTranslation();
  return (
    <main className="ui-splash" aria-busy="true">
      <span className="ui-splash__mark" aria-hidden>
        <PiggyBank size={44} />
      </span>
      <h1 className="ui-splash__name">{t('common.appName')}</h1>
      <p className="ui-splash__tag">{t('onboard.promise')}</p>
    </main>
  );
}

function LangStep(props: { onDone: () => void }) {
  const { t } = useTranslation();
  const [lang, pick] = useState<Lang | null>(storedLang());
  return (
    <main className="ui-page ui-page--plain">
      <div className="ui-intro">
        <h1 className="ui-title-lg">{t('onboard.chooseLang')}</h1>
      </div>
      <div className="ui-langlist" role="radiogroup" aria-label={t('onboard.chooseLang')}>
        {LANGS.map((l) => (
          <button
            key={l.code}
            type="button"
            role="radio"
            lang={l.code}
            aria-checked={lang === l.code}
            className="ui-langbtn"
            onClick={() => {
              pick(l.code);
              void setLang(l.code);
            }}
          >
            <span>{l.native}</span>
            {lang === l.code && <Check size={22} aria-hidden />}
          </button>
        ))}
      </div>
      <Button block disabled={!lang} onClick={props.onDone}>
        {t('common.next')}
      </Button>
    </main>
  );
}

function Intro(props: { onDone: () => void }) {
  const { t } = useTranslation();
  const [i, setI] = useState(0);
  const P = policy.params;
  const vars = { worker: pct(P.worker_rate.value), employer: P.employer_rate_steps.value.map((s) => `${pct(s.rate)}%`).join('→') };
  const slides = [
    { icon: <PiggyBank size={40} />, title: t('start.intro1Title'), body: t('start.intro1Body', vars) },
    { icon: <Repeat size={40} />, title: t('start.intro2Title'), body: t('start.intro2Body') },
    { icon: <Plane size={40} />, title: t('start.intro3Title'), body: t('start.intro3Body') },
  ];
  const last = i === slides.length - 1;
  return (
    <main className="ui-page ui-page--plain ui-onboard">
      <div className="ui-row ui-row--between">
        <span className="ui-small">{t('start.progress', { n: i + 1, total: slides.length })}</span>
        <button type="button" className="ui-linkbtn ui-muted" onClick={props.onDone}>
          {t('start.skip')}
        </button>
      </div>
      <section className="ui-slide" aria-live="polite">
        <span className="ui-splash__mark" aria-hidden>
          {slides[i].icon}
        </span>
        <h1 className="ui-title-lg">{slides[i].title}</h1>
        <p className="ui-sub">{slides[i].body}</p>
      </section>
      <div className="ui-dots" aria-hidden>
        {slides.map((_, k) => (
          <span key={k} className={k === i ? 'ui-dots__on' : undefined} />
        ))}
      </div>
      <Button block onClick={() => (last ? props.onDone() : setI(i + 1))}>
        {last ? t('start.begin') : t('common.next')}
      </Button>
    </main>
  );
}

function Login(props: { onLogin: (memberId: string) => void }) {
  const { t, i18n } = useTranslation();
  const q = useQuery((r) => r.listMembers(), []);
  return (
    <main className="ui-page ui-page--plain">
      <div className="ui-intro">
        <h1 className="ui-title-lg">{t('login.title')}</h1>
        <p className="ui-sub">{t('login.lead')}</p>
      </div>
      <h2 className="ui-section-title">{t('login.accounts')}</h2>
      <List>
        {q.status === 'ok' &&
          q.data.map((v) => (
            <button
              key={v.member.member_id}
              type="button"
              className="ui-listrow"
              onClick={() => {
                session.set(v.member.member_id);
                props.onLogin(v.member.member_id);
              }}
            >
              <span className="ui-avatar" aria-hidden>
                {v.person.name_latin.slice(0, 1)}
              </span>
              <span className="ui-listrow__body">
                <span className="ui-listrow__title">{displayName(v, i18n.language)}</span>
                <span className="ui-listrow__desc">
                  {t(`country.${v.person.nationality_iso2}`)} · {v.visa.visa_type}
                </span>
              </span>
              <span className="ui-listrow__end">
                <ChevronRight size={20} aria-hidden />
              </span>
            </button>
          ))}
      </List>
      <p className="ui-small">{t('login.note')}</p>
      {!isStudy() && (
        <p className="ui-small ui-center">
          <Link to="/demo">{t('login.demoMenu')}</Link>
        </p>
      )}
    </main>
  );
}
