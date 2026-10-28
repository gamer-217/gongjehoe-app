import type { Page } from '@playwright/test';

/** 매 테스트 전 시연 초기화(§7.1) */
export async function fresh(page: Page, lang = 'ko') {
  await page.goto('./');
  await page.evaluate((l) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('gongjehoe.lang', l);
  }, lang);
}

export const won = (n: number) => n.toLocaleString('en-US');
