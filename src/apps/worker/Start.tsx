// 앱 시작 흐름 — 스플래시 → (처음) 언어 선택 → 소개 3장 → 가입·로그인 고르기 → 본인 확인 → (가입) 계좌 확인·동의 → 간편 비밀번호 → 홈
// 로그인한 채로 다시 열면 스플래시 → 홈, 로그아웃 뒤에는 스플래시 → 간편 비밀번호. 실제 본인인증은 실서비스 단계(§13)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, PiggyBank, Plane, Repeat } from 'lucide-react';
import { policy, type Lang } from '../../domain';
import type { MemberView } from '../../data/repository';
import { LANGS, setLang, storedLang } from '../../i18n';
import { Button } from '../../ui';
import { pct } from '../shared/Money';
import { device, Found, PinLogin, PinSet, Verify, Welcome, type AuthMode } from './Auth';

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

type Step = 'splash' | 'lang' | 'intro' | 'welcome' | 'verify' | 'found' | 'pin' | 'pinlogin';

export function AppStart() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>('splash');
  const [mode, setMode] = useState<AuthMode>('signup');
  const [found, setFound] = useState<MemberView | null>(null);
  // 소개 다음: 이 기기에 등록된 계정이 있으면 간편 비밀번호, 없으면 가입·로그인 고르기
  const afterIntro = (): Step => (device.get() ? 'pinlogin' : 'welcome');
  const enter = (memberId: string) => {
    session.set(memberId);
    nav(`/w/${memberId}`, { replace: true });
  };

  useEffect(() => {
    if (step !== 'splash') return;
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(
      () => {
        const id = session.get();
        if (id) nav(`/w/${id}`, { replace: true });
        else if (!storedLang()) setStep('lang');
        else if (!read(INTRO_SEEN)) setStep('intro');
        else setStep(afterIntro());
      },
      reduce ? 300 : 1100,
    );
    return () => clearTimeout(t);
  }, [step, nav]);

  return (
    <div className="ui-mobile ui-start">
      {step !== 'splash' && <StartHead />}
      {step === 'splash' && <Splash />}
      {step === 'lang' && <LangStep onDone={() => setStep(read(INTRO_SEEN) ? afterIntro() : 'intro')} />}
      {step === 'intro' && (
        <Intro
          onDone={() => {
            write(INTRO_SEEN, '1');
            setStep(afterIntro());
          }}
        />
      )}
      {step === 'welcome' && (
        <Welcome
          onPick={(m) => {
            setMode(m);
            setStep('verify');
          }}
        />
      )}
      {step === 'verify' && (
        <Verify
          mode={mode}
          onBack={() => setStep(afterIntro())}
          onVerified={(v) => {
            setFound(v);
            setStep(mode === 'signup' ? 'found' : 'pin');
          }}
        />
      )}
      {step === 'found' && found && <Found view={found} onNext={() => setStep('pin')} />}
      {step === 'pin' && found && (
        <PinSet
          onDone={(pin) => {
            device.set(found.member.member_id, pin);
            enter(found.member.member_id);
          }}
        />
      )}
      {step === 'pinlogin' && (
        <PinLogin
          memberId={device.get()?.memberId ?? ''}
          onOk={() => enter(device.get()!.memberId)}
          onForgot={() => {
            setMode('login');
            setStep('verify');
          }}
          onOther={() => {
            device.clear();
            setStep('welcome');
          }}
        />
      )}
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
