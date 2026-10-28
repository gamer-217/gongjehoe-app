// 다국어(§10.1) — 모든 문구는 locales/*.json에서만
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from '../locales/ko.json' with { type: 'json' };
import en from '../locales/en.json' with { type: 'json' };
import vi from '../locales/vi.json' with { type: 'json' };
import ne from '../locales/ne.json' with { type: 'json' };
import id from '../locales/id.json' with { type: 'json' };
import type { Lang } from './domain';

export const LANGS: { code: Lang; native: string }[] = [
  { code: 'ko', native: '한국어' },
  { code: 'en', native: 'English' },
  { code: 'vi', native: 'Tiếng Việt' },
  { code: 'ne', native: 'नेपाली' },
  { code: 'id', native: 'Bahasa Indonesia' },
];

const KEY = 'gongjehoe.lang';

export function storedLang(): Lang | null {
  try {
    const v = localStorage.getItem(KEY);
    return LANGS.some((l) => l.code === v) ? (v as Lang) : null;
  } catch {
    return null;
  }
}

export function setLang(lang: Lang) {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    // 저장 실패는 무시 — 이번 화면에서만 유지
  }
  void i18n.changeLanguage(lang);
}

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
});

void i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    en: { translation: en },
    vi: { translation: vi },
    ne: { translation: ne },
    id: { translation: id },
  },
  lng: storedLang() ?? 'ko',
  fallbackLng: 'ko',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
