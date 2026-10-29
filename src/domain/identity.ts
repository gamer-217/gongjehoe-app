// 앱 가입·로그인 본인 확인(모의). 실서비스 본인인증은 §13.
// 외국인등록번호는 앞 7자리(생년월일 6 + 성별 1)만 받는다 — 전체 번호는 다루지 않는다(§15).
// 하이픈·띄어쓰기는 넣어도 되고 빼도 된다(§2 경쟁 앱 불만: 입력 형식 오류로 가입 실패).

export const digitsOnly = (s: string) => s.replace(/\D/g, '');

/** 입력에서 숫자만 모아 정확히 7자리면 돌려준다 */
export function ridFront7(input: string): string | null {
  const d = digitsOnly(input);
  return d.length === 7 ? d : null;
}

/** 휴대폰 번호: 01로 시작하는 10~11자리(하이픈·띄어쓰기 허용) */
export function isMobileNumber(input: string): boolean {
  return /^01\d{8,9}$/.test(digitsOnly(input));
}

/** 마스킹된 번호(예: 900101-5••••••)의 앞 7자리와 맞는 사람을 찾는다 */
export function findByRidFront7<T extends { rid_masked: string }>(front7: string, people: T[]): T | undefined {
  return people.find((p) => digitsOnly(p.rid_masked).slice(0, 7) === front7);
}

export const PIN_LENGTH = 6;
/** 간편 비밀번호: 숫자 6자리, 같은 숫자 6번·연속 숫자(123456, 654321)는 안 됨 */
export function pinProblem(pin: string): 'length' | 'simple' | null {
  if (!/^\d{6}$/.test(pin)) return 'length';
  if (/^(\d)\1{5}$/.test(pin) || '0123456789'.includes(pin) || '9876543210'.includes(pin)) return 'simple';
  return null;
}
