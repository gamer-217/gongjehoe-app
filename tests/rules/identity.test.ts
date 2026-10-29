import { describe, expect, it } from 'vitest';
import { findByRidFront7, isMobileNumber, pinProblem, ridFront7 } from '../../src/domain';

describe('앱 가입 본인 확인(모의)', () => {
  it('외국인등록번호 앞 7자리: 하이픈·띄어쓰기 허용', () => {
    expect(ridFront7('900101-5')).toBe('9001015');
    expect(ridFront7(' 900101 5 ')).toBe('9001015');
    expect(ridFront7('9001015')).toBe('9001015');
    expect(ridFront7('900101')).toBeNull();
    expect(ridFront7('900101-51')).toBeNull();
  });
  it('마스킹된 번호의 앞 7자리로 사람을 찾는다', () => {
    const people = [{ id: 'a', rid_masked: '900101-5••••••' }, { id: 'b', rid_masked: '930217-6••••••' }];
    expect(findByRidFront7('9302176', people)?.id).toBe('b');
    expect(findByRidFront7('9302175', people)).toBeUndefined();
  });
  it('휴대폰 번호', () => {
    expect(isMobileNumber('010-1234-5678')).toBe(true);
    expect(isMobileNumber('010 1234 5678')).toBe(true);
    expect(isMobileNumber('02-123-4567')).toBe(false);
  });
  it('간편 비밀번호 6자리, 너무 쉬운 번호는 거절', () => {
    expect(pinProblem('135790')).toBeNull();
    expect(pinProblem('12345')).toBe('length');
    expect(pinProblem('111111')).toBe('simple');
    expect(pinProblem('123456')).toBe('simple');
    expect(pinProblem('654321')).toBe('simple');
  });
});
