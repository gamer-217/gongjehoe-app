// P9·P10 화면 검수: 5개 언어 × 근로자 전 화면(390px) + 데스크톱(1280px)
// - axe(WCAG 2.2 AA) 위반 수 → reports/a11y.json
// - 가로 넘침(scrollWidth > clientWidth), ko 외 언어 DOM의 한글 → reports/screens.json
// - 스크린샷 → reports/screens/{lang}/{name}.png (직접 열어 겹침·잘림 확인)
import { mkdirSync, writeFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const LANGS = ['ko', 'en', 'vi', 'ne', 'id'] as const;
const HANGUL = /[가-힣ㄱ-ㆎ]/;

type Step = (p: Page) => Promise<void>;
const primary = (p: Page) => p.locator('main .ui-btn--primary').last();
const applyTo = (n: 1 | 2 | 3 | 4): Step => async (p) => {
  await p.locator('[role="radiogroup"] [role="radio"]').nth(n === 1 ? 2 : 1).click();
  if (n === 1) return;
  await primary(p).click();
  if (n === 2) return;
  await primary(p).click();
  await p.getByRole('checkbox').check();
  if (n === 3) return;
  await primary(p).click();
};
const submitClaim: Step = async (p) => {
  await applyTo(4)(p);
  await p.locator('[role="dialog"] .ui-btn--primary').click();
  await p.waitForTimeout(200);
};

export const WORKER: { name: string; route: string; step?: Step }[] = [
  { name: 'w01-language', route: '/w/W001/start' },
  { name: 'w10-home', route: '/w/W001' },
  { name: 'w10-home-siti', route: '/w/W003' },
  { name: 'w10-home-kim', route: '/w/W004' },
  { name: 'nps-home', route: '/w/W005' },
  { name: 'nps-receive', route: '/w/W005/receive' },
  { name: 'nps-simulate', route: '/w/W005/receive/simulate', step: async (p) => p.locator('[role="radio"]').nth(2).click() },
  { name: 'nps-notice', route: '/w/W005/receive/apply' },
  { name: 'w20-history', route: '/w/W002/history' },
  { name: 'w21-statement', route: '/w/W001/history/statement', step: async (p) => primary(p).click() },
  { name: 'receive-hub', route: '/w/W001/receive' },
  { name: 'w30-simulate', route: '/w/W002/receive/simulate', step: async (p) => p.locator('[role="radio"]').nth(2).click() },
  { name: 'w30-simulate-nonnps', route: '/w/W001/receive/simulate', step: async (p) => p.locator('[role="radio"]').nth(3).click() },
  { name: 'w31-apply-date', route: '/w/W001/receive/apply', step: applyTo(1) },
  { name: 'w31-apply-account', route: '/w/W001/receive/apply', step: applyTo(2) },
  { name: 'w31-apply-confirm', route: '/w/W001/receive/apply', step: applyTo(3) },
  { name: 'w31-apply-secure', route: '/w/W001/receive/apply', step: applyTo(4) },
  { name: 'w31-apply-done', route: '/w/W001/receive/apply', step: submitClaim },
  { name: 'w32-status-empty', route: '/w/W001/receive/status' },
  { name: 'w33-convert', route: '/w/W004/receive/convert' },
  { name: 'w40-me', route: '/w/W001/me' },
  { name: 'w41-nominees', route: '/w/W003/me/nominees' },
  { name: 'w41-nominees-empty', route: '/w/W001/me/nominees' },
  { name: 'w42-accounts-add', route: '/w/W002/me/accounts', step: async (p) => p.locator('main .ui-btn--secondary').first().click() },
  { name: 'w43-coverage', route: '/w/W001/me/coverage', step: async (p) => p.locator('button[aria-expanded]').nth(5).click() },
  { name: 'w44-language', route: '/w/W001/me/language' },
  { name: 'w45-help', route: '/w/W001/me/help' },
];

const DESKTOP: { name: string; route: string }[] = [
  { name: 'launcher', route: '/' },
  { name: 'e10-dashboard', route: '/e' },
  { name: 'e20-worker', route: '/e/workers/W002' },
  { name: 'e30-bill', route: '/e/bill' },
  { name: 'e40-hire', route: '/e/hire' },
  { name: 'a10-fund', route: '/a' },
  { name: 'a20-claims', route: '/a/claims' },
  { name: 'a30-sim', route: '/a/sim' },
  { name: 'ui-preview', route: '/ui' },
];

const a11y: Record<string, Record<string, number>> = {};
const details: { lang: string; screen: string; id: string; impact: string | null | undefined; nodes: number; help: string }[] = [];
const screens: Record<string, Record<string, { overflow: boolean; hangul: number }>> = {};

async function prepare(page: Page, lang: string, portalLang = 'ko') {
  await page.goto('./');
  await page.evaluate(
    ([l, pl]) => {
      localStorage.clear();
      localStorage.setItem('gongjehoe.lang', l);
      localStorage.setItem('gongjehoe.portalLang', pl);
    },
    [lang, portalLang],
  );
}

async function inspect(page: Page, lang: string, name: string, checkHangul: boolean) {
  await page.waitForTimeout(250);
  const r = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    // 원어 표기로 lang="ko"가 붙은 요소(언어 선택의 '한국어')는 제외
    text: (() => {
      const c = document.body.cloneNode(true) as HTMLElement;
      c.querySelectorAll('[lang="ko"]').forEach((e) => e.remove());
      return c.textContent ?? '';
    })(),
  }));
  const hangul = checkHangul ? (r.text.match(/[가-힣ㄱ-ㆎ]/g) ?? []).length : 0;
  const axe = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  (a11y[lang] ??= {})[name] = axe.violations.length;
  for (const v of axe.violations) details.push({ lang, screen: name, id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help });
  (screens[lang] ??= {})[name] = { overflow: r.overflow, hangul };
  mkdirSync('reports/.raw', { recursive: true });
  writeFileSync(
    `reports/.raw/${lang}__${name}.json`,
    JSON.stringify({ lang, name, overflow: r.overflow, hangul, violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 5) })) }),
  );
  mkdirSync(`reports/screens/${lang}`, { recursive: true });
  await page.screenshot({ path: `reports/screens/${lang}/${name}.png`, fullPage: true });
  return { overflow: r.overflow, hangul, violations: axe.violations.map((v) => `${v.id}(${v.nodes.length})`) };
}

for (const lang of LANGS) {
  test.describe(`근로자 ${lang}`, () => {
    for (const s of WORKER) {
      test(`${lang} ${s.name}`, async ({ page }) => {
        await prepare(page, lang);
        await page.goto(`./#${s.route}`);
        await page.reload();
        await page.locator('main').first().waitFor();
        if (s.step) await s.step(page);
        const r = await inspect(page, lang, s.name, lang !== 'ko');
        expect.soft(r.overflow, 'horizontal overflow').toBe(false);
        expect.soft(r.hangul, 'Hangul in non-ko DOM').toBe(0);
        expect.soft(r.violations, 'axe violations').toEqual([]);
      });
    }
  });
}

test.describe('데스크톱 1280', () => {
  test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });
  for (const pl of ['ko', 'en'] as const) {
    for (const s of DESKTOP) {
      test(`desktop-${pl} ${s.name}`, async ({ page }) => {
        await prepare(page, 'ko', pl);
        await page.goto(`./#${s.route}`);
        await page.reload();
        await page.waitForTimeout(300);
        const r = await inspect(page, `desktop-${pl}`, s.name, false);
        expect.soft(r.overflow, 'horizontal overflow').toBe(false);
        expect.soft(r.violations, 'axe violations').toEqual([]);
      });
    }
  }
});

void a11y;
void details;
void HANGUL;
