// 사용성 테스트 과업 T1~T5(§11.1)를 자동으로 끝까지 수행
import { expect, test } from '@playwright/test';
import data from '../../fixtures/demo.json' with { type: 'json' };
import { balance, policy, project, type Dataset } from '../../src/domain';
import { fresh, pin, won } from './helpers';

const ds = data as unknown as Dataset;
const totalOf = (m: string) => balance(ds.ledger.filter((e) => e.member_id === m)).total;

test('T1 내 언어(베트남어)로 바꾸고 총 적립액 확인', async ({ page }) => {
  // 첫 실행: 언어 선택 → 소개 건너뛰기 → 앱 가입(Aung, 본인 확인·동의·간편 비밀번호) → 홈
  await page.goto('./');
  await page.getByRole('radio', { name: 'Tiếng Việt' }).click();
  await page.locator('main .ui-btn--primary').click();
  await page.getByRole('button', { name: 'Bỏ qua' }).click();
  await page.getByRole('button', { name: /Đăng ký/ }).click();
  await page.getByLabel('7 chữ số đầu của số đăng ký').fill('980803-5');
  await page.getByLabel('Số điện thoại di động').fill('01012345678');
  await page.getByRole('button', { name: 'Nhận mã' }).click();
  await page.getByLabel('Mã 6 chữ số').fill('246810');
  await page.getByRole('button', { name: 'Xác nhận' }).click();
  await expect(page.getByText('Aung Ko Ko')).toBeVisible();
  await page.getByText('Tôi đồng ý tất cả').click();
  await page.locator('main .ui-btn--primary').click();
  await pin(page, '135790');
  await pin(page, '135790');
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await expect(page.getByText(new RegExp(won(totalOf('W002')))).first()).toBeVisible();
});

test('T2 이번 달 회사 돈이 들어왔는지 확인', async ({ page }) => {
  await fresh(page);
  await page.goto('./#/w/W001');
  await expect(page.getByRole('heading', { name: '2026.09분 납입' })).toBeVisible();
  await expect(page.getByText('납입 확인', { exact: true })).toBeVisible();
});

test('T3 1년 뒤 귀국하면 얼마인지 확인', async ({ page }) => {
  await fresh(page);
  await page.goto('./#/w/W001');
  await page.getByRole('link', { name: '귀국하면 얼마?' }).click();
  await page.getByRole('radio', { name: '1년 뒤' }).click();
  const bills = ds.bills.filter((b) => b.employment_id.startsWith('W001'));
  const last = bills.at(-1)!;
  const expected = project({ confirmedTotal: totalOf('W001'), lastWage: last.wage_krw, lastSeq: last.member_month_seq, lastYm: last.ym }, 12, policy).total;
  await expect(page.getByRole('heading', { name: '2027.09에 귀국하면' })).toBeVisible();
  await expect(page.getByText(`${won(expected)}원`).first()).toBeVisible();
  await expect(page.getByText('예시').first()).toBeVisible();
});

test('T4 다음 달 출국으로 환급 신청 → 접수 → 취소', async ({ page }) => {
  await fresh(page);
  await page.goto('./#/w/W001');
  await page.getByRole('link', { name: '받기' }).click();
  await page.getByRole('link', { name: /환급 신청/ }).click();
  await page.getByRole('radio', { name: '한 달 뒤' }).click();
  await expect(page.getByText('고른 날: 2026.11.14')).toBeVisible();
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByRole('radio', { name: /Nabil Bank/ })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByLabel('내용이 맞으며, 출국 후 환급을 신청합니다.').check();
  await page.getByRole('button', { name: '신청하기' }).click();
  await expect(page.getByRole('dialog', { name: '본인이 맞나요?' })).toBeVisible();
  await page.getByRole('button', { name: '네, 본인이에요' }).click();
  await expect(page.getByRole('heading', { name: '신청이 접수되었어요' })).toBeVisible();
  await page.getByRole('button', { name: '신청 현황 보기' }).click();
  await expect(page.getByText('접수', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: '신청 취소' }).click();
  await page.getByRole('button', { name: '네, 취소할게요' }).click();
  await expect(page.getByText('취소됨').first()).toBeVisible();
});

test('T5 어머니를 수급권자로 지정', async ({ page }) => {
  await fresh(page);
  await page.goto('./#/w/W001/me');
  await page.getByRole('link', { name: /수급권자/ }).click();
  await page.getByRole('button', { name: '가족 추가' }).click();
  await page.getByLabel('이름').fill('Maya Gurung');
  await page.getByRole('radio', { name: '어머니' }).click();
  await page.getByRole('radio', { name: '100%' }).click();
  await page.getByRole('button', { name: '저장' }).click();
  await page.getByRole('button', { name: '네, 본인이에요' }).click();
  await expect(page.getByText('가족을 저장했어요.')).toBeVisible();
  await expect(page.getByText('1명 지정')).toBeVisible();
});

test('BR-11 지분 합계가 100%가 아니면 저장 안 됨', async ({ page }) => {
  await fresh(page);
  await page.goto('./#/w/W001/me/nominees');
  await page.getByRole('button', { name: '가족 추가' }).click();
  await page.getByRole('button', { name: '가족 추가' }).click();
  await page.getByLabel('이름').nth(0).fill('A');
  await page.getByLabel('이름').nth(1).fill('B');
  await page.getByRole('button', { name: '저장' }).click();
  await expect(page.getByText('몫을 골라 주세요.')).toBeVisible();
  await page.getByRole('radiogroup', { name: '받을 몫' }).nth(1).getByRole('radio', { name: '50%' }).click();
  await expect(page.getByText('합계 150%')).toBeVisible();
  await expect(page.getByText('몫의 합계가 100%가 되어야 해요.')).toBeVisible();
  await page.getByRole('button', { name: '똑같이 나누기' }).click();
  await expect(page.getByText('합계 100%')).toBeVisible();
});

test('W-42 계좌번호 하이픈·공백 허용, 예금주 확인 후 저장', async ({ page }) => {
  await fresh(page);
  await page.goto('./#/w/W002/me/accounts');
  await page.getByRole('button', { name: '새 계좌 등록' }).click();
  await page.getByLabel('은행').selectOption('AYA Bank');
  await page.getByLabel('계좌번호').fill('0071 000-123 456');
  await expect(page.getByText('정리된 번호: 0071000123456')).toBeVisible();
  await page.getByRole('button', { name: '예금주 확인' }).click();
  await page.getByRole('button', { name: '계좌 저장' }).click();
  await page.getByRole('button', { name: '네, 본인이에요' }).click();
  await expect(page.getByText('계좌를 저장했어요.')).toBeVisible();
  await expect(page.getByText(/•+3456/)).toBeVisible();
});

test('데모 칩으로 신청을 끝까지 진행하면 잔액 0·환급 완료', async ({ page }) => {
  await fresh(page);
  await page.goto('./#/w/W003/receive/apply');
  await page.getByRole('radio', { name: '2주 뒤' }).click();
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: '신청하기' }).click();
  await page.getByRole('button', { name: '네, 본인이에요' }).click();
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: '데모 메뉴' }).click();
    await page.getByRole('menuitem', { name: '신청 다음 단계로' }).click();
  }
  await page.getByRole('link', { name: '홈' }).click();
  await expect(page.getByText('환급이 끝났어요')).toBeVisible();
  await expect(page.getByText('0원', { exact: true }).first()).toBeVisible();
});

test('?study=1이면 데모 칩이 숨겨진다', async ({ page }) => {
  await fresh(page);
  await page.goto('./?study=1#/w/W001');
  await expect(page.getByRole('heading', { name: '2026.09분 납입' })).toBeVisible();
  await expect(page.getByRole('button', { name: '데모 메뉴' })).toHaveCount(0);
});

test('§5.2-7 미납 시연: Aung 홈에 미납(빨강) 표시', async ({ page }) => {
  await fresh(page);
  await page.goto('./#/w/W002');
  await expect(page.getByRole('heading', { name: '2026.09분 납입' })).toBeVisible();
  await expect(page.getByText('미납', { exact: true })).toBeVisible();
  await expect(page.getByText(/회사에 물어봐 주세요/)).toBeVisible();
});

test('알림 읽음: 배당 알림을 확인하면 다시 뜨지 않는다', async ({ page }) => {
  await fresh(page);
  await page.goto('./#/w/W004');
  await expect(page.getByText('2025년 운용수익이 확정되었어요')).toBeVisible();
  await page.getByRole('button', { name: '확인했어요' }).click();
  await expect(page.getByText('2025년 운용수익이 확정되었어요')).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('2025년 운용수익이 확정되었어요')).toHaveCount(0);
});

test('BR-23 국민연금 적용국 근로자(W005 베트남)는 공제회 대신 국민연금 안내', async ({ page }) => {
  await fresh(page);
  await page.goto('./#/w/W005');
  await expect(page.getByRole('heading', { name: '국민연금 반환일시금을 그대로 받아요' })).toBeVisible();
  await expect(page.getByText('총 적립액')).toHaveCount(0);
  await page.goto('./#/w/W005/receive/apply');
  await expect(page.getByText('공제회 적립 대상이 아니에요')).toBeVisible();
  await page.goto('./#/w/W005/me/coverage');
  await expect(page.getByText('해당 없음 · 국민연금을 그대로 받아요')).toBeVisible();
});

test('앱 시작: 언어 → 소개 → 앱 가입(본인 확인·동의·간편 비밀번호) → 홈, 다시 열면 바로 홈, 로그아웃 뒤 간편 비밀번호', async ({ page }) => {
  // 테스트마다 새 브라우저 저장소 → 첫 실행 상태. 해시 이동 대신 실제 로드로 연다
  await page.goto('./');
  await page.getByRole('radio', { name: '한국어' }).click();
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await expect(page.getByRole('heading', { name: '일한 만큼 내 계좌에 쌓여요' })).toBeVisible();
  await page.getByRole('button', { name: '건너뛰기' }).click();
  await page.getByRole('button', { name: /앱 가입하기/ }).click();
  // 형식 오류 → 없는 번호 → 맞는 번호(하이픈·띄어쓰기 허용)
  await page.getByRole('button', { name: '인증번호 받기' }).click();
  await expect(page.getByText('숫자 7자리를 넣어 주세요.')).toBeVisible();
  await page.getByLabel('외국인등록번호 앞 7자리').fill('000000-0');
  await page.getByLabel('휴대폰 번호').fill('010-1234-5678');
  await page.getByRole('button', { name: '인증번호 받기' }).click();
  await page.getByLabel('인증번호 6자리').fill('246810');
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.getByText(/가입된 계좌를 찾지 못했어요/)).toBeVisible();
  await page.getByLabel('외국인등록번호 앞 7자리').fill('900101 5');
  await page.getByRole('button', { name: '인증번호 받기' }).click();
  await page.getByLabel('인증번호 6자리').fill('111111');
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.getByText('인증번호가 맞지 않아요.')).toBeVisible();
  await page.getByLabel('인증번호 6자리').fill('246810');
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.getByRole('heading', { name: '내 계좌를 찾았어요' })).toBeVisible();
  await expect(page.getByText('Ramesh Gurung')).toBeVisible();
  const next = page.getByRole('button', { name: '다음', exact: true });
  await expect(next).toBeDisabled();
  await page.getByText('모두 동의해요').click();
  await next.click();
  // 쉬운 번호 거절 → 확인 불일치 → 정상
  await pin(page, '111111');
  await expect(page.getByText(/너무 쉬운 번호예요/)).toBeVisible();
  await pin(page, '135790');
  await expect(page.getByRole('heading', { name: '한 번 더 눌러 주세요' })).toBeVisible();
  await pin(page, '135791');
  await expect(page.getByText(/두 번호가 달라요/)).toBeVisible();
  await pin(page, '135790');
  await pin(page, '135790');
  await expect(page.getByRole('heading', { name: '2026.09분 납입' })).toBeVisible();
  // 로그인한 채로 다시 열면 바로 홈
  await page.goto('./?reopen=1');
  await expect(page).toHaveURL(/#\/w\/W001$/);
  // 로그아웃 → 간편 비밀번호(틀리면 다시)
  await page.goto('./#/w/W001/me');
  await page.getByRole('button', { name: '로그아웃' }).click();
  await expect(page.getByRole('heading', { name: 'Ramesh Gurung 님, 반가워요' })).toBeVisible();
  await pin(page, '000000');
  await expect(page.getByText('비밀번호가 맞지 않아요. 다시 눌러 주세요.')).toBeVisible();
  await pin(page, '135790');
  await expect(page.getByRole('heading', { name: '2026.09분 납입' })).toBeVisible();
});
