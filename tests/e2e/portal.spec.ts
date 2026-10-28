// 사업주·운영자 화면(§8.3·8.4) — 근로자 신청이 운영자 처리함에 같은 데이터로 보인다
import { expect, test } from '@playwright/test';
import { fresh } from './helpers';

test.use({ viewport: { width: 1280, height: 900 } });

test('E-10 대시보드: 재직 4명, 국민연금 적용국만 차액 계산, 총무 입력 0', async ({ page }) => {
  await fresh(page);
  await page.goto('./#/e');
  await expect(page.getByRole('heading', { name: '한빛정밀(주) 대시보드' })).toBeVisible();
  await expect(page.getByText('4명', { exact: true })).toBeVisible();
  await expect(page.getByText('국민연금 적용국 근로자 3명만 계산')).toBeVisible();
  await expect(page.getByText(/새로 생기는 부담/)).toBeVisible();
  await expect(page.getByText(/총무 추가 입력 0/)).toBeVisible();
  await page.getByRole('link', { name: 'Nguyen Van An' }).click();
  await expect(page.getByText('이 사업장 근속 6개월 · 공제회 가입 18개월')).toBeVisible();
  await expect(page.getByText('다른 사업장 기간 12개월은 표시하지 않아요.')).toBeVisible();
});

test('E-30 납부·E-40 자동 가입', async ({ page }) => {
  await fresh(page);
  await page.goto('./#/e/bill');
  await expect(page.getByText('추가 신고 없음', { exact: true })).toBeVisible();
  await page.goto('./#/e/hire');
  await page.getByRole('radio', { name: '980803-5••••••' }).click();
  await expect(page.getByText(/가입 19개월째부터/)).toBeVisible();
});

test('W-31 신청 → A-20 처리 → 근로자 W-32에 입금 완료', async ({ page }) => {
  await fresh(page);
  await page.goto('./#/w/W004/receive/apply');
  await page.getByRole('radio', { name: '2주 뒤' }).click();
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: '신청하기' }).click();
  await page.getByRole('button', { name: '네, 본인이에요' }).click();
  await expect(page.getByRole('heading', { name: '신청이 접수되었어요' })).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('./#/a/claims');
  await expect(page.getByRole('cell', { name: '김해란' })).toBeVisible();
  for (const a of ['출국 확인', '승인', '입금 처리']) await page.getByRole('button', { name: a, exact: true }).click();
  await expect(page.getByText('입금 완료').first()).toBeVisible();

  await page.goto('./#/a');
  await expect(page.getByText(/1건 · ₩/)).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./#/w/W004/receive/status');
  await expect(page.getByText('입금 완료').first()).toBeVisible();
  await expect(page.getByText(/을 보냈어요/)).toBeVisible();
});

test('A-20 반려는 사유와 함께, 근로자 가입 상태는 적립 중으로 복귀', async ({ page }) => {
  await fresh(page);
  await page.goto('./#/w/W001/receive/apply');
  await page.getByRole('radio', { name: '한 달 뒤' }).click();
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: '신청하기' }).click();
  await page.getByRole('button', { name: '네, 본인이에요' }).click();
  await page.goto('./#/a/claims');
  await page.getByLabel('반려 사유').selectOption('ACCOUNT_MISMATCH');
  await page.getByRole('button', { name: '반려', exact: true }).click();
  await page.goto('./#/w/W001/receive/status');
  await expect(page.getByText('반려 사유: 계좌 예금주가 본인과 달라요.')).toBeVisible();
  await page.goto('./#/w/W001/me');
  await expect(page.getByText('적립 중', { exact: true })).toBeVisible();
});

test('A-30 재정 시뮬레이터: 슬라이더를 움직이면 결과가 바뀐다', async ({ page }) => {
  await fresh(page);
  await page.goto('./#/a/sim');
  const kpi = page.locator('.ui-kpi__value').first();
  const before = await kpi.textContent();
  await page.getByLabel(/기금 운용 수익률/).fill('6');
  await expect(kpi).not.toHaveText(before!);
});
