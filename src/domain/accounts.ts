// 수령 계좌 — W-42. 계좌번호는 공백·하이픈을 허용하고 자동 정리한다(§2.4 교훈)
export function normalizeAccountNumber(input: string): string {
  return input.replace(/[\s\-–—.]/g, '');
}

export function isValidAccountNumber(input: string): boolean {
  const n = normalizeAccountNumber(input);
  return /^[0-9]{6,20}$/.test(n);
}

/** 마지막 4자리만 보이게 */
export function maskAccount(input: string): string {
  const n = normalizeAccountNumber(input);
  return '•'.repeat(Math.max(n.length - 4, 0)) + n.slice(-4);
}

/** NFR-05: 등록번호는 항상 마스킹. 뒤 첫 자리 이후 가림 */
export function maskRid(birth6: string, genderDigit: string): string {
  return `${birth6}-${genderDigit}••••••`;
}
