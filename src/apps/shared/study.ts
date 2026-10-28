// 연구용 기록(§11.2) — ?study=1일 때만, 브라우저 안에만. 이름·번호는 남기지 않는다
import { clock } from '../../domain';

const FLAG = 'gongjehoe.study';
const LOG = 'gongjehoe.study.log';

export interface StudyEvent {
  ms: number;
  type: 'view' | 'click';
  target: string;
}

function readFlag(): boolean {
  try {
    const q = new URLSearchParams(window.location.search);
    const hq = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    if (q.get('study') === '1' || hq.get('study') === '1') sessionStorage.setItem(FLAG, '1');
    if (q.get('study') === '0' || hq.get('study') === '0') sessionStorage.removeItem(FLAG);
    return sessionStorage.getItem(FLAG) === '1';
  } catch {
    return false;
  }
}

export const isStudy = (): boolean => (typeof window === 'undefined' ? false : readFlag());

let memory: StudyEvent[] = [];

export function logStudy(type: StudyEvent['type'], target: string) {
  if (!isStudy()) return;
  const ev = { ms: Math.round(clock.elapsedMs()), type, target };
  memory.push(ev);
  try {
    const prev = JSON.parse(sessionStorage.getItem(LOG) ?? '[]') as StudyEvent[];
    prev.push(ev);
    sessionStorage.setItem(LOG, JSON.stringify(prev));
  } catch {
    // 메모리에만
  }
}

export function readStudyLog(): StudyEvent[] {
  try {
    return JSON.parse(sessionStorage.getItem(LOG) ?? 'null') ?? memory;
  } catch {
    return memory;
  }
}

export function clearStudyLog() {
  memory = [];
  try {
    sessionStorage.removeItem(LOG);
  } catch {
    // 무시
  }
}

/** 클릭 대상 설명: 접근 가능한 이름 대신 역할·경로만(개인정보 제외) */
export function describeTarget(el: Element | null): string {
  const t = el?.closest('a,button,[role="radio"],input,select');
  if (!t) return 'other';
  const route = t.getAttribute('href') ?? '';
  return `${t.tagName.toLowerCase()}${route ? ':' + route.replace(/W00\d/, ':id') : ''}${t.getAttribute('data-track') ? '#' + t.getAttribute('data-track') : ''}`;
}
