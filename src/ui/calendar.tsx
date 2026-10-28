// 달력 선택(키보드 입력 없음, §10.2). 범위 밖 날짜는 비활성
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, daysInMonth, toDays, ymOf, type ISODate } from '../domain';

export function Calendar(props: {
  min: ISODate;
  max: ISODate;
  value: ISODate | null;
  onChange: (d: ISODate) => void;
  dow: string[];
  monthLabel: (ym: string) => string;
  prevLabel: string;
  nextLabel: string;
  dayLabel: (d: ISODate) => string;
}) {
  const [ym, setYm] = useState(ymOf(props.value ?? props.min));
  const firstDow = (((toDays(`${ym}-01`) + 4) % 7) + 7) % 7; // 1970-01-01은 목요일
  const n = daysInMonth(ym);
  const cells: (ISODate | null)[] = [...Array.from({ length: firstDow }, () => null), ...Array.from({ length: n }, (_, i) => `${ym}-${String(i + 1).padStart(2, '0')}`)];
  return (
    <div className="ui-stack ui-stack--tight">
      <div className="ui-row ui-row--between">
        <button type="button" className="ui-iconbtn" onClick={() => setYm(addMonths(ym, -1))} disabled={ym <= ymOf(props.min)} aria-label={props.prevLabel}>
          <ChevronLeft size={22} aria-hidden />
        </button>
        <span className="ui-strong num" aria-live="polite">
          {props.monthLabel(ym)}
        </span>
        <button type="button" className="ui-iconbtn" onClick={() => setYm(addMonths(ym, 1))} disabled={ym >= ymOf(props.max)} aria-label={props.nextLabel}>
          <ChevronRight size={22} aria-hidden />
        </button>
      </div>
      <div className="ui-cal" role="group" aria-label={props.monthLabel(ym)}>
        {props.dow.map((d) => (
          <span key={d} className="ui-cal__dow" aria-hidden>
            {d}
          </span>
        ))}
        {cells.map((d, i) =>
          d ? (
            <button
              key={d}
              type="button"
              disabled={d < props.min || d > props.max}
              aria-pressed={props.value === d}
              onClick={() => props.onChange(d)}
            >
              {Number(d.slice(8))}
              <span className="sr-only"> ({props.dayLabel(d)})</span>
            </button>
          ) : (
            <span key={`e${i}`} />
          ),
        )}
      </div>
    </div>
  );
}
