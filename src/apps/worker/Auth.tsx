// 앱 가입·로그인(모의) — 공제회 가입은 회사가 고용할 때 자동으로 된다(E-40).
// 앱은 처음 한 번 본인 확인(외국인등록번호 앞 7자리 + 휴대폰 인증) → 동의 → 간편 비밀번호를 정하고,
// 다음부터는 이 기기에서 간편 비밀번호로 들어온다. 실제 본인인증·기기 등록은 실서비스 단계(§13).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Delete, Wallet } from 'lucide-react';
import { findByRidFront7, formatYM, isMobileNumber, PIN_LENGTH, pinProblem, ridFront7 } from '../../domain';
import { useQuery } from '../../data/context';
import type { MemberView } from '../../data/repository';
import { displayName, employerName, summarize } from '../../data/selectors';
import { Button, Card } from '../../ui';
import { isStudy } from '../shared/study';

// 시연용 인증번호. 실서비스에서는 문자로 받는다
const DEMO_CODE = '246810';
const DEVICE = 'gongjehoe.device';

/** 이 기기에 등록된 계정(시연: 브라우저 저장소) */
export const device = {
  get(): { memberId: string; pin: string } | null {
    try {
      const raw = localStorage.getItem(DEVICE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(memberId: string, pin: string) {
    try {
      localStorage.setItem(DEVICE, JSON.stringify({ memberId, pin }));
    } catch {
      // 저장 실패 — 이번 실행 동안만 로그인
    }
  },
  clear() {
    try {
      localStorage.removeItem(DEVICE);
    } catch {
      // 무시
    }
  },
};

export type AuthMode = 'signup' | 'login';

export function Welcome(props: { onPick: (m: AuthMode) => void }) {
  const { t } = useTranslation();
  return (
    <main className="ui-page ui-page--plain">
      <section className="ui-slide">
        <span className="ui-splash__mark" aria-hidden>
          <Wallet size={40} />
        </span>
        <h1 className="ui-title-lg">{t('auth.welcomeTitle')}</h1>
        <p className="ui-sub">{t('auth.welcomeBody')}</p>
      </section>
      <div className="ui-stack ui-auth-actions">
        <Button block onClick={() => props.onPick('signup')}>
          {t('auth.signup')}
        </Button>
        <Button block variant="secondary" onClick={() => props.onPick('login')}>
          {t('auth.login')}
        </Button>
        {!isStudy() && (
          <p className="ui-small ui-center">
            <Link to="/demo">{t('login.demoMenu')}</Link>
          </p>
        )}
      </div>
    </main>
  );
}

export function Verify(props: { mode: AuthMode; onBack: () => void; onVerified: (v: MemberView) => void }) {
  const { t, i18n } = useTranslation();
  const q = useQuery((r) => r.listMembers(), []);
  const [rid, setRid] = useState('');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [tried, setTried] = useState(false);
  const [codeTried, setCodeTried] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const front = ridFront7(rid);
  const phoneOk = isMobileNumber(phone);

  const send = () => {
    setTried(true);
    setNotFound(false);
    if (front && phoneOk) setSent(true);
  };
  const confirm = () => {
    setCodeTried(true);
    if (code.replace(/\s/g, '') !== DEMO_CODE || q.status !== 'ok' || !front) return;
    const v = findByRidFront7(front, q.data.map((m) => ({ ...m, rid_masked: m.person.rid_masked })));
    if (!v) {
      setNotFound(true);
      setSent(false);
      setCode('');
      setCodeTried(false);
      return;
    }
    props.onVerified(v);
  };

  return (
    <main className="ui-page ui-page--plain">
      <div className="ui-row ui-row--between">
        <button type="button" className="ui-linkbtn" onClick={props.onBack}>
          {t('common.back')}
        </button>
      </div>
      <div className="ui-intro">
        <h1 className="ui-title-lg">{props.mode === 'signup' ? t('auth.verifyTitleSignup') : t('auth.verifyTitleLogin')}</h1>
        <p className="ui-sub">{t('auth.verifyLead')}</p>
      </div>
      <form
        className="ui-stack"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (sent) confirm();
          else send();
        }}
      >
        <div className="ui-field">
          <label htmlFor="rid">{t('auth.rid')}</label>
          <input id="rid" className="ui-input num" inputMode="numeric" autoComplete="off" placeholder="000000-0" value={rid} onChange={(e) => setRid(e.target.value)} aria-describedby="rid-h" disabled={sent} />
          <span className="ui-field__hint" id="rid-h">
            {t('auth.ridHint')}
          </span>
          {tried && !front && <span className="ui-field__error">{t('auth.ridErr')}</span>}
        </div>
        <div className="ui-field">
          <label htmlFor="phone">{t('auth.phone')}</label>
          <input id="phone" className="ui-input num" inputMode="tel" autoComplete="tel" placeholder="010-0000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={sent} />
          {tried && !phoneOk && <span className="ui-field__error">{t('auth.phoneErr')}</span>}
        </div>
        {notFound && (
          <p className="ui-field__error" role="alert">
            {t('auth.notFound')}
          </p>
        )}
        {!sent && (
          <Button block type="submit">
            {t('auth.sendCode')}
          </Button>
        )}
        {sent && (
          <>
            <p className="ui-small" role="status">
              {t('auth.codeSent')}
            </p>
            <div className="ui-field">
              <label htmlFor="code">{t('auth.code')}</label>
              <input id="code" className="ui-input num" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} aria-describedby="code-h" autoFocus />
              <span className="ui-field__hint" id="code-h">
                {t('auth.demoCode', { code: DEMO_CODE })}
              </span>
              {codeTried && code.replace(/\s/g, '') !== DEMO_CODE && <span className="ui-field__error">{t('auth.codeErr')}</span>}
            </div>
            <Button block type="submit">
              {t('auth.verify')}
            </Button>
            <button
              type="button"
              className="ui-linkbtn"
              onClick={() => {
                setSent(false);
                setCode('');
                setCodeTried(false);
              }}
            >
              {t('auth.editNumbers')}
            </button>
          </>
        )}
      </form>
      <details className="ui-auth-demo">
        <summary>{t('auth.demoIds')}</summary>
        <ul>
          {q.status === 'ok' &&
            q.data.map((v) => (
              <li key={v.member.member_id}>
                <button type="button" className="ui-linkbtn num" onClick={() => setRid(v.person.rid_masked.slice(0, 8))} disabled={sent}>
                  {v.person.rid_masked.slice(0, 8)}
                </button>{' '}
                {displayName(v, i18n.language)}
              </li>
            ))}
        </ul>
      </details>
      <p className="ui-small">{t('auth.realNote')}</p>
    </main>
  );
}

export function Found(props: { view: MemberView; onNext: () => void }) {
  const { t, i18n } = useTranslation();
  const v = props.view;
  const s = summarize(v);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const all = terms && privacy;
  return (
    <main className="ui-page ui-page--plain">
      <div className="ui-intro">
        <h1 className="ui-title-lg">{t('auth.foundTitle')}</h1>
        <p className="ui-sub">{s.track === 'FUND' ? t('auth.foundLead') : t('auth.foundNps')}</p>
      </div>
      <Card>
        <dl className="ui-kv">
          <dt>{t('me.name')}</dt>
          <dd>{displayName(v, i18n.language)}</dd>
          <dt>{t('me.nationality')}</dt>
          <dd>{t(`country.${v.person.nationality_iso2}`)}</dd>
          <dt>{t('me.visa')}</dt>
          <dd>{v.visa.visa_type}</dd>
          <dt>{t('me.employer')}</dt>
          <dd>{s.currentEmployer && employerName(s.currentEmployer.employer, i18n.language)}</dd>
          {s.track === 'FUND' && (
            <>
              <dt>{t('me.joined')}</dt>
              <dd className="num">{formatYM(v.member.joined_ym)}</dd>
            </>
          )}
        </dl>
      </Card>
      <p className="ui-small">{t('auth.notMe')}</p>
      <div className="ui-stack ui-auth-agree">
        <label className="ui-check ui-strong">
          <input
            type="checkbox"
            checked={all}
            onChange={(e) => {
              setTerms(e.target.checked);
              setPrivacy(e.target.checked);
            }}
          />
          <span>{t('auth.agreeAll')}</span>
        </label>
        <label className="ui-check">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span>{t('auth.agreeTerms')}</span>
        </label>
        <label className="ui-check">
          <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
          <span>{t('auth.agreePrivacy')}</span>
        </label>
      </div>
      <Button block disabled={!all} onClick={props.onNext}>
        {t('common.next')}
      </Button>
    </main>
  );
}

/** 숫자 키패드 + 입력 점. 실물 키보드 숫자·백스페이스도 받는다 */
function PinPad(props: { title: string; lead?: string; error?: string | null; onComplete: (pin: string) => void; footer?: ReactNode }) {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const done = useRef(props.onComplete);
  done.current = props.onComplete;
  const push = (d: string) => setPin((p) => (p.length >= PIN_LENGTH ? p : p + d));
  const pop = () => setPin((p) => p.slice(0, -1));
  // 6자리가 차면 점이 다 찬 모습을 잠깐 보여 준 뒤 넘긴다
  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;
    const id = setTimeout(() => done.current(pin), 150);
    return () => clearTimeout(id);
  }, [pin]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) push(e.key);
      else if (e.key === 'Backspace') pop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  // 틀리면 점을 비운다
  useEffect(() => {
    if (props.error) setPin('');
  }, [props.error]);
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  return (
    <main className="ui-page ui-page--plain ui-pin">
      <div className="ui-intro">
        <h1 className="ui-title-lg">{props.title}</h1>
        {props.lead && <p className="ui-sub">{props.lead}</p>}
      </div>
      <div className="ui-pin__dots" role="status" aria-label={t('auth.pinEntered', { n: pin.length, total: PIN_LENGTH })}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span key={i} className={i < pin.length ? 'ui-pin__dot ui-pin__dot--on' : 'ui-pin__dot'} />
        ))}
      </div>
      <p className="ui-field__error ui-center ui-pin__error" role="alert">
        {props.error ?? ''}
      </p>
      <div className="ui-pin__pad">
        {keys.map((k) => (
          <button key={k} type="button" className="ui-pin__key num" onClick={() => push(k)}>
            {k}
          </button>
        ))}
        <span aria-hidden />
        <button type="button" className="ui-pin__key num" onClick={() => push('0')}>
          0
        </button>
        <button type="button" className="ui-pin__key" onClick={pop} aria-label={t('auth.keyDelete')}>
          <Delete size={24} aria-hidden />
        </button>
      </div>
      {props.footer}
    </main>
  );
}

export function PinSet(props: { onDone: (pin: string) => void }) {
  const { t } = useTranslation();
  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  return (
    <PinPad
      key={round}
      title={first ? t('auth.pinConfirmTitle') : t('auth.pinSetTitle')}
      lead={t('auth.pinSetLead')}
      error={error}
      onComplete={(pin) => {
        if (!first) {
          const p = pinProblem(pin);
          if (p) {
            setError(t('auth.pinSimple'));
            setRound((r) => r + 1);
            return;
          }
          setError(null);
          setFirst(pin);
          setRound((r) => r + 1);
        } else if (pin === first) {
          props.onDone(pin);
        } else {
          setError(t('auth.pinMismatch'));
          setFirst(null);
          setRound((r) => r + 1);
        }
      }}
    />
  );
}

export function PinLogin(props: { memberId: string; onOk: () => void; onForgot: () => void; onOther: () => void }) {
  const { t, i18n } = useTranslation();
  const q = useQuery((r) => r.getMember(props.memberId), [props.memberId]);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const name = q.status === 'ok' ? displayName(q.data, i18n.language) : '';
  return (
    <PinPad
      key={round}
      title={t('auth.pinLoginTitle', { name })}
      lead={t('auth.pinLoginLead')}
      error={error}
      onComplete={(pin) => {
        if (pin === device.get()?.pin) props.onOk();
        else {
          setError(t('auth.pinWrong'));
          setRound((r) => r + 1);
        }
      }}
      footer={
        <div className="ui-row ui-row--between ui-pin__links">
          <button type="button" className="ui-linkbtn" onClick={props.onForgot}>
            {t('auth.pinForgot')}
          </button>
          <button type="button" className="ui-linkbtn" onClick={props.onOther}>
            {t('auth.otherAccount')}
          </button>
        </div>
      }
    />
  );
}
