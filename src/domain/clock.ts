// BR-22: '오늘'을 아는 유일한 모듈. 코드에서 Date.now()·new Date() 직접 사용 금지.
import { policy } from './policy';
import type { ISODate, YM } from './types';

let override: ISODate | null = null;

export const clock = {
  today(): ISODate {
    return override ?? policy.demo.today;
  },
  latestPaidYm(): YM {
    return policy.demo.latest_paid_ym;
  },
  /** 테스트 전용 */
  setToday(d: ISODate | null) {
    override = d;
  },
  /** 연구용 소요 시간 측정(§11.2) — 날짜가 아닌 경과 밀리초만 */
  elapsedMs(): number {
    return typeof performance !== 'undefined' ? performance.now() : 0;
  },
};
