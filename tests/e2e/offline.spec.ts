// NFR-04: 한 번 연 화면은 오프라인에서도 열린다(PWA 캐시)
import { expect, test } from '@playwright/test';
import { fresh } from './helpers';

test.use({ serviceWorkers: 'allow' });

test('서비스워커 설치 후 오프라인에서 홈이 열린다', async ({ page, context }) => {
  await fresh(page);
  await page.goto('./#/w/W001');
  await expect(page.getByRole('heading', { name: '2026.09분 납입' })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: '2026.09분 납입' })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: '2026.09분 납입' })).toBeVisible();
  await page.getByRole('link', { name: '내역' }).click();
  await expect(page.getByRole('heading', { name: '내역' })).toBeVisible();
  await context.setOffline(false);
});
