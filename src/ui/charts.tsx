// SVG 직접 구현 차트(§14.2-4: 차트 라이브러리 금지)
import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface Series {
  name: string;
  color: string;
  values: number[];
  dashed?: boolean;
}

/** 꺾은선. xLabels는 값 개수와 같다. 축 라벨은 처음·끝·(선택)중간만 */
export function LineChart(props: {
  series: Series[];
  xLabels: string[];
  label: string;
  height?: number;
  yFormat?: (v: number) => string;
  showLegend?: boolean;
  area?: boolean;
  minY?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [W, setW] = useState(320);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = props.height ?? 120;
  const padL = props.yFormat ? 40 : 4;
  const padR = 8;
  const padT = 8;
  const padB = 20;
  const all = props.series.flatMap((s) => s.values);
  const max = Math.max(...all, 1);
  const min = props.minY ?? Math.min(0, ...all);
  const n = props.xLabels.length;
  const x = (i: number) => padL + (n <= 1 ? 0 : (i / (n - 1)) * (W - padL - padR));
  const y = (v: number) => padT + (1 - (v - min) / (max - min || 1)) * (H - padT - padB);
  const ticks = n > 2 ? [0, Math.floor((n - 1) / 2), n - 1] : [0, n - 1];
  return (
    <figure className="ui-figure" ref={ref}>
      <svg className="ui-chart" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={props.label}>
        {props.yFormat &&
          [min, (min + max) / 2, max].map((v) => (
            <g key={v}>
              <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="var(--color-line)" />
              <text x={padL - 6} y={y(v) + 4} textAnchor="end">
                {props.yFormat!(v)}
              </text>
            </g>
          ))}
        {props.series.map((s) => {
          const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
          return (
            <g key={s.name}>
              {props.area && (
                <polygon points={`${x(0)},${y(min)} ${pts} ${x(s.values.length - 1)},${y(min)}`} fill={s.color} opacity="0.12" />
              )}
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeDasharray={s.dashed ? '6 4' : undefined} />
            </g>
          );
        })}
        {[...new Set(ticks)].map((i) => (
          <text key={i} x={x(i)} y={H - 4} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>
            {props.xLabels[i]}
          </text>
        ))}
      </svg>
      {props.showLegend && <Legend items={props.series.map((s) => ({ label: s.name, color: s.color }))} />}
    </figure>
  );
}

export function Legend(props: { items: { label: ReactNode; color?: string; hatch?: boolean }[] }) {
  return (
    <div className="ui-legend">
      {props.items.map((it, i) => (
        <span key={i}>
          <span className={`ui-legend__sw${it.hatch ? ' ui-legend__sw--hatch' : ''}`} style={it.color ? { background: it.color } : undefined} aria-hidden />
          {it.label}
        </span>
      ))}
    </div>
  );
}

/** 가로 막대 비교. 값과 라벨은 글자로도 보인다(색만으로 구분 금지) */
export function BarChart(props: {
  label: string;
  rows: { key: string; label: ReactNode; valueText: ReactNode; value: number; extra?: number; tone?: 'primary' | 'gray' }[];
}) {
  const max = Math.max(...props.rows.map((r) => r.value + (r.extra ?? 0)), 1);
  return (
    <div className="ui-bars" role="group" aria-label={props.label}>
      {props.rows.map((r) => (
        <div key={r.key}>
          <div className="ui-bar__label">
            <span>{r.label}</span>
            <span className="ui-strong num">{r.valueText}</span>
          </div>
          <div className="ui-bar__track" aria-hidden>
            <span className={`ui-bar__fill${r.tone === 'gray' ? ' ui-bar__fill--gray' : ''}`} style={{ width: `${(r.value / max) * 100}%` }} />
            {r.extra ? <span className="ui-bar__fill ui-bar__fill--hatch" style={{ width: `${(r.extra / max) * 100}%` }} /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
