// 날짜 계산 — Date 객체 없이 정수 산술로만(시간대 영향 없음, BR-22)
import type { ISODate, YM } from './types';

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** 1970-01-01 기준 일수 (Howard Hinnant civil algorithm) */
export function toDays(d: ISODate): number {
  let [y, m, day] = d.split('-').map(Number);
  y -= m <= 2 ? 1 : 0;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export function fromDays(z: number): ISODate {
  z += 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp + (mp < 10 ? 3 : -9);
  const y = yoe + era * 400 + (m <= 2 ? 1 : 0);
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}

export const addDays = (d: ISODate, n: number): ISODate => fromDays(toDays(d) + n);
export const diffDays = (a: ISODate, b: ISODate): number => toDays(a) - toDays(b);

export const ymIndex = (ym: YM): number => {
  const [y, m] = ym.split('-').map(Number);
  return y * 12 + (m - 1);
};
export const ymFromIndex = (i: number): YM => `${pad(Math.floor(i / 12), 4)}-${pad((i % 12) + 1)}`;
export const addMonths = (ym: YM, n: number): YM => ymFromIndex(ymIndex(ym) + n);
export const ymOf = (d: ISODate): YM => d.slice(0, 7);
export const yearOf = (d: ISODate | YM): number => Number(d.slice(0, 4));

export function daysInMonth(ym: YM): number {
  const next = addMonths(ym, 1);
  return diffDays(`${next}-01`, `${ym}-01`);
}
export const monthEnd = (ym: YM): ISODate => `${ym}-${pad(daysInMonth(ym))}`;
export const monthDay = (ym: YM, day: number): ISODate => `${ym}-${pad(day)}`;

/** 모든 언어 공통 표기 2026.09.30 (§10.1) */
export const formatDate = (d: ISODate): string => d.replaceAll('-', '.');
export const formatYM = (ym: YM): string => ym.replace('-', '.');

/** 그해 1월 1일부터 d까지 경과 일수(당일 포함) */
export const dayOfYear = (d: ISODate): number => diffDays(d, `${d.slice(0, 4)}-01-01`) + 1;
export const daysInYear = (y: number): number => diffDays(`${y + 1}-01-01`, `${y}-01-01`);
