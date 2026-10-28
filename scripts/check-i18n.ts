// 다국어 검사(NFR-02, §10.1, §12-3) → reports/i18n.json. 문제가 하나라도 있으면 빌드 실패
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Json = { [k: string]: unknown };
const LANGS = ['ko', 'en', 'vi', 'ne', 'id'] as const;
/** portal(사업주·운영자 데스크톱)은 ko·en만 */
const PORTAL_LANGS = new Set(['ko', 'en']);
const HANGUL = /[ㄱ-ㆎ가-힣]/;
const DEVA_DIGITS = /[०-९]/;

const load = (l: string) => JSON.parse(readFileSync(`locales/${l}.json`, 'utf8')) as Json;
function flat(o: unknown, p = ''): Record<string, string | string[]> {
  if (o === null || typeof o !== 'object' || Array.isArray(o)) return { [p.slice(0, -1)]: o as string };
  return Object.entries(o as Json).reduce((acc, [k, v]) => {
    if (p === '' && k === '_meta') return acc;
    return { ...acc, ...flat(v, `${p}${k}.`) };
  }, {} as Record<string, string | string[]>);
}
const text = (v: string | string[]) => (Array.isArray(v) ? v.join(' ') : String(v ?? ''));
const placeholders = (v: string | string[]) => [...text(v).matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort().join(',');

const ko = flat(load('ko'));
const problems: string[] = [];
const report: Record<string, unknown> = {};

for (const lang of LANGS) {
  const raw = load(lang);
  const meta = (raw._meta ?? {}) as { _review?: string };
  const t = flat(raw);
  const required = Object.keys(ko).filter((k) => PORTAL_LANGS.has(lang) || !k.startsWith('portal.'));
  const missing = required.filter((k) => !(k in t) || text(t[k]).trim() === '');
  const extra = Object.keys(t).filter((k) => !(k in ko));
  const placeholderMismatch = required.filter((k) => k in t && placeholders(t[k]) !== placeholders(ko[k]));
  const labelMissing: string[] = [];
  if (lang !== 'ko') {
    for (const [mark, key] of [['(제안)', 'common.proposal'], ['(검토 중)', 'common.reviewing']] as const) {
      const token = text(t[key]);
      for (const k of required) if (text(ko[k]).includes(mark) && !text(t[k]).includes(token)) labelMissing.push(k);
    }
  }
  const hangulLeaks = lang === 'ko' ? [] : Object.keys(t).filter((k) => HANGUL.test(text(t[k])));
  const devaDigits = lang === 'ne' ? Object.keys(t).filter((k) => DEVA_DIGITS.test(text(t[k]))) : [];
  report[lang] = {
    keys: Object.keys(t).length,
    required: required.length,
    missing: missing.length,
    extra: extra.length,
    placeholderMismatch: placeholderMismatch.length,
    labelMissing: labelMissing.length,
    hangulLeaks: hangulLeaks.length,
    devanagariDigits: devaDigits.length,
    machineTranslated: meta._review === 'machine' ? Object.keys(t).length : 0,
    review: meta._review ?? null,
  };
  for (const [name, list] of Object.entries({ missing, extra, placeholderMismatch, labelMissing, hangulLeaks, devaDigits }))
    if (list.length) problems.push(`${lang}.${name}: ${list.slice(0, 8).join(', ')}${list.length > 8 ? ` …(+${list.length - 8})` : ''}`);
}

// 화면 코드(src/apps/**)에 한글 직접 입력·인라인 스타일 금지(§10.1, §9.4). 주석 제외
const codeHangul: string[] = [];
const inlineStyle: string[] = [];
const walk = (dir: string) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?)$/.test(f)) {
      const src = readFileSync(p, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
      src.split('\n').forEach((line, i) => {
        if (HANGUL.test(line)) codeHangul.push(`${p}:${i + 1}`);
        if (/\sstyle=\{/.test(line)) inlineStyle.push(`${p}:${i + 1}`);
      });
    }
  }
};
walk('src/apps');
if (codeHangul.length) problems.push(`src/apps 한글 직접 입력: ${codeHangul.join(', ')}`);
if (inlineStyle.length) problems.push(`src/apps 인라인 스타일: ${inlineStyle.join(', ')}`);
report.code = { hangulInApps: codeHangul.length, inlineStyleInApps: inlineStyle.length };

mkdirSync('reports', { recursive: true });
writeFileSync('reports/i18n.json', JSON.stringify(report, null, 2) + '\n');
if (problems.length) {
  console.error('i18n 검사 실패\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log('i18n 검사 통과:', LANGS.map((l) => `${l} ${(report[l] as { keys: number }).keys}키`).join(' · '));
