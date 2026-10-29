import type { Page } from '@playwright/test';

/** 매 테스트 전 시연 초기화(§7.1) */
export async function fresh(page: Page, lang = 'ko') {
  // 첫 로드 전에 저장소를 비우고 언어를 정한다(같은 테스트 안의 새로고침에서는 다시 비우지 않음)
  await page.addInitScript((l) => {
    if (sessionStorage.getItem('__fresh')) return;
    localStorage.clear();
    localStorage.setItem('gongjehoe.lang', l);
    sessionStorage.setItem('__fresh', '1');
  }, lang);
}

export const won = (n: number) => n.toLocaleString('en-US');
