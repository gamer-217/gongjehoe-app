// 다국어(§10.1) — 모든 문구는 locales/*.json에서만. 한국어(기준)만 첫 번들에 넣고 나머지는 필요할 때 받는다
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from '../locales/ko.json' with { type: 'json' };
import type { Lang } from './domain';

export const LANGS: { code: Lang; native: string }[] = [
  { code: 'ko', native: '한국어' },
  { code: 'en', native: 'English' },
  { code: 'vi', native: 'Tiếng Việt' },
  { code: 'ne', native: 'नेपाली' },
  { code: 'id', native: 'Bahasa Indonesia' },
];

const loaders: Record<Exclude<Lang, 'ko'>, () => Promise<{ default: unknown }>> = {
  en: () => import('../locales/en.json'),
  vi: () => import('../locales/vi.json'),
  ne: () => import('../locales/ne.json'),
  id: () => import('../locales/id.json'),
};

const KEY = 'gongjehoe.lang';

export function storedLang(): Lang | null {
  try {
    const v = localStorage.getItem(KEY);
    return LANGS.some((l) => l.code === v) ? (v as Lang) : null;
  } catch {
    return null;
  }
}

/** 언어 묶음을 받아 둔다(이미 있으면 바로 끝) */
export async function ensureLang(lang: Lang): Promise<void> {
  if (lang === 'ko' || i18n.hasResourceBundle(lang, 'translation')) return;
  const m = await loaders[lang]();
  i18n.addResourceBundle(lang, 'translation', m.default, true, true);
}

export async function setLang(lang: Lang) {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    // 저장 실패는 무시 — 이번 화면에서만 유지
  }
  await ensureLang(lang);
  await i18n.changeLanguage(lang);
}

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
});

/** 처음 실행(저장된 언어 없음): 휴대폰 언어가 지원 언어면 그 언어, 아니면 영어 */
function detectLang(): Lang {
  try {
    for (const l of navigator.languages ?? [navigator.language]) {
      const code = l.toLowerCase().slice(0, 2);
      if (LANGS.some((x) => x.code === code)) return code as Lang;
    }
  } catch {
    // 무시
  }
  return 'en';
}

const initial = storedLang() ?? detectLang();
void i18n.use(initReactI18next).init({
  resources: { ko: { translation: ko } },
  lng: 'ko',
  fallbackLng: 'ko',
  interpolation: { escapeValue: false },
  returnNull: false,
});
/** 첫 화면 언어가 준비되면 끝나는 약속 — main.tsx가 기다린 뒤 그린다(한국어가 잠깐 보이는 것 방지) */
export const i18nReady: Promise<void> =
  initial === 'ko' ? Promise.resolve() : ensureLang(initial).then(() => i18n.changeLanguage(initial)).then(() => undefined);

export default i18n;
