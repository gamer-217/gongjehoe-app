// 사업주·운영자 공통 틀 — 데스크톱, 한국어 기본·영어 전환(portal.* 키는 ko·en만)
import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import i18n from '../../i18n';
import type { TFunction } from 'i18next';

const KEY = 'gongjehoe.portalLang';
type PLang = 'ko' | 'en';

function readLang(): PLang {
  try {
    return localStorage.getItem(KEY) === 'en' ? 'en' : 'ko';
  } catch {
    return 'ko';
  }
}

export function usePortalLang(): [PLang, (l: PLang) => void, TFunction] {
  const [lang, set] = useState<PLang>(readLang);
  const setLang = (l: PLang) => {
    try {
      localStorage.setItem(KEY, l);
    } catch {
      // 무시
    }
    set(l);
  };
  return [lang, setLang, i18n.getFixedT(lang)];
}

export function PortalFrame(props: {
  brand: string;
  home: string;
  nav: { to: string; label: string; end?: boolean }[];
  lang: PLang;
  setLang: (l: PLang) => void;
  t: TFunction;
  children: ReactNode;
}) {
  return (
    <div lang={props.lang}>
      <header className="ui-topnav">
        <div className="ui-topnav__inner">
          <Link to={props.home} className="ui-topnav__brand">
            {props.brand}
          </Link>
          <nav aria-label={props.brand}>
            {props.nav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <span className="ui-spacer" />
          <div className="ui-chips" role="radiogroup" aria-label="Language">
            {(['ko', 'en'] as const).map((l) => (
              <button key={l} type="button" role="radio" className="ui-chip" aria-checked={props.lang === l} onClick={() => props.setLang(l)} lang={l}>
                {l === 'ko' ? '한국어' : 'English'}
              </button>
            ))}
          </div>
          <Link to="/" className="ui-small">
            ← Demo
          </Link>
        </div>
      </header>
      <main className="ui-desktop">{props.children}</main>
      <div className="ui-watermark" aria-hidden>
        {props.t('portal.demoData')}
      </div>
    </div>
  );
}
