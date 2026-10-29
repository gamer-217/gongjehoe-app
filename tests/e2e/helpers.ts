import type { Page } from '@playwright/test';

/** 매 테스트 전 시연 초기화(§7.1) */
export async function fresh(page: Page, lang = 'ko') {
  await page.goto('./#/demo');
  await page.evaluate((l) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('gongjehoe.lang', l);
  }, lang);
  // 첫 실행 언어는 휴대폰 언어로 정해지므로, 저장한 언어로 다시 읽어 들인다
  await page.reload();
}

export const won = (n: number) => n.toLocaleString('en-US');
