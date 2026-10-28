// 디자인 시스템 컴포넌트(§9.4). 문구는 모두 props로 받는다(화면에서 t()로 넘김).
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, ChevronRight, Eye, EyeOff, Info, X, XCircle } from 'lucide-react';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* ── AppBar ─────────────────────────── */
export function AppBar(props: { title: string; backTo?: string; backLabel?: string; actions?: ReactNode; titleId?: string }) {
  return (
    <header className={cx('ui-appbar', props.backTo && 'ui-appbar--sub')}>
      {props.backTo && (
        <Link className="ui-iconbtn" to={props.backTo} aria-label={props.backLabel}>
          <ArrowLeft size={24} aria-hidden />
        </Link>
      )}
      <h1 className="ui-appbar__title" id={props.titleId}>
        {props.title}
      </h1>
      {props.actions}
    </header>
  );
}

/* ── TabBar ─────────────────────────── */
export interface TabItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}
export function TabBar(props: { items: TabItem[]; label: string }) {
  return (
    <nav className="ui-tabbar" aria-label={props.label}>
      {props.items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.end}>
          {it.icon}
          <span>{it.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/* ── Card ───────────────────────────── */
export function Card(props: { children: ReactNode; variant?: 'hero' | 'flat' | 'weak'; className?: string; as?: 'section' | 'div' | 'article'; labelledBy?: string }) {
  const Tag = props.as ?? 'section';
  return (
    <Tag className={cx('ui-card', props.variant && `ui-card--${props.variant}`, props.className)} aria-labelledby={props.labelledBy}>
      {props.children}
    </Tag>
  );
}
export function CardLink(props: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={props.to} className={cx('ui-card', props.className)}>
      {props.children}
    </Link>
  );
}

/* ── AmountDisplay ─────────────────── */
export const formatKrw = (n: number) => Math.round(n).toLocaleString('en-US');

export function AmountDisplay(props: {
  value: number;
  size?: 'xl' | 'lg' | 'md' | 'sm';
  hidden?: boolean;
  /** 스크린리더용 전체 문장(예: "5,436,835원") */
  srLabel: string;
  hiddenLabel?: string;
  sign?: boolean;
  className?: string;
}) {
  const v = props.value;
  const text = (props.sign && v > 0 ? '+' : v < 0 ? '−' : '') + formatKrw(Math.abs(v));
  if (props.hidden) {
    return (
      <span className={cx('ui-amount', `ui-amount--${props.size ?? 'md'}`, props.className)} aria-label={props.hiddenLabel}>
        <span aria-hidden>••••••</span>
      </span>
    );
  }
  return (
    <span className={cx('ui-amount', `ui-amount--${props.size ?? 'md'}`, props.className)} role="text" aria-label={props.srLabel}>
      <span className="ui-amount__cur" aria-hidden>
        ₩
      </span>
      <span aria-hidden>{text}</span>
    </span>
  );
}

export function HideAmountButton(props: { hidden: boolean; onToggle: () => void; showLabel: string; hideLabel: string }) {
  return (
    <button type="button" className="ui-iconbtn" onClick={props.onToggle} aria-pressed={props.hidden} aria-label={props.hidden ? props.showLabel : props.hideLabel}>
      {props.hidden ? <EyeOff size={22} aria-hidden /> : <Eye size={22} aria-hidden />}
    </button>
  );
}

/* ── Button ────────────────────────── */
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export function Button(props: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  block?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  ariaLabel?: string;
}) {
  return (
    <button
      type={props.type ?? 'button'}
      className={cx('ui-btn', `ui-btn--${props.variant ?? 'primary'}`, props.block && 'ui-btn--block')}
      onClick={props.onClick}
      disabled={props.disabled}
      aria-label={props.ariaLabel}
    >
      {props.children}
    </button>
  );
}
export function ButtonLink(props: { to: string; children: ReactNode; variant?: BtnVariant; block?: boolean }) {
  return (
    <Link to={props.to} className={cx('ui-btn', `ui-btn--${props.variant ?? 'primary'}`, props.block && 'ui-btn--block')}>
      {props.children}
    </Link>
  );
}

/* ── StatusBadge(색 + 글자 + 아이콘) ── */
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
const toneIcon: Record<Tone, ReactNode> = {
  success: <CheckCircle2 size={14} aria-hidden />,
  warning: <AlertTriangle size={14} aria-hidden />,
  danger: <XCircle size={14} aria-hidden />,
  info: <Info size={14} aria-hidden />,
  neutral: null,
};
export function StatusBadge(props: { tone: Tone; children: ReactNode; icon?: boolean }) {
  return (
    <span className={cx('ui-badge', `ui-badge--${props.tone}`)}>
      {props.icon !== false && toneIcon[props.tone]}
      {props.children}
    </span>
  );
}

/* ── ListRow ───────────────────────── */
export function List(props: { children: ReactNode; label?: string }) {
  return (
    <div className="ui-list" role={props.label ? 'group' : undefined} aria-label={props.label}>
      {props.children}
    </div>
  );
}
export function ListRow(props: {
  title: ReactNode;
  desc?: ReactNode;
  icon?: ReactNode;
  end?: ReactNode;
  to?: string;
  onClick?: () => void;
  chevron?: boolean;
  expanded?: boolean;
}) {
  const inner = (
    <>
      {props.icon && <span className="ui-listrow__icon">{props.icon}</span>}
      <span className="ui-listrow__body">
        <span className="ui-listrow__title">
          {props.title}
        </span>
        {props.desc && (
          <span className="ui-listrow__desc">
            {props.desc}
          </span>
        )}
      </span>
      {(props.end || props.chevron) && (
        <span className="ui-listrow__end">
          {props.end}
          {props.chevron && <ChevronRight size={20} aria-hidden />}
        </span>
      )}
    </>
  );
  if (props.to)
    return (
      <Link className="ui-listrow" to={props.to}>
        {inner}
      </Link>
    );
  if (props.onClick)
    return (
      <button type="button" className="ui-listrow" onClick={props.onClick} aria-expanded={props.expanded}>
        {inner}
      </button>
    );
  return <div className="ui-listrow">{inner}</div>;
}

/* ── Chip / ChipGroup ──────────────── */
export function ChipGroup<T extends string | number>(props: {
  label: string;
  options: { value: T; label: ReactNode }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="ui-chips" role="radiogroup" aria-label={props.label}>
      {props.options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          className="ui-chip"
          aria-checked={props.value === o.value}
          onClick={() => props.onChange(o.value)}
        >
          {props.value === o.value && <Check size={16} aria-hidden />}
          {o.label}
        </button>
      ))}
    </div>
  );
}
export function Chip(props: { children: ReactNode; pressed?: boolean; onClick?: () => void }) {
  return (
    <button type="button" className="ui-chip" aria-pressed={props.pressed} onClick={props.onClick}>
      {props.children}
    </button>
  );
}

/* ── BottomSheet(시간 제한 없음, §10.2) ── */
export function BottomSheet(props: { open: boolean; onClose: () => void; title: string; children: ReactNode; closeLabel: string }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!props.open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && props.onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [props.open]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!props.open) return null;
  return (
    <div className="ui-sheet-backdrop" onClick={props.onClose}>
      <div className="ui-sheet" role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <div className="ui-sheet__grip" aria-hidden />
        <div className="ui-row ui-row--between">
          <h2 className="ui-title" id={id}>
            {props.title}
          </h2>
          <button type="button" className="ui-iconbtn" onClick={props.onClose} aria-label={props.closeLabel}>
            <X size={22} aria-hidden />
          </button>
        </div>
        {props.children}
      </div>
    </div>
  );
}

/* ── Stepper ───────────────────────── */
export function Stepper(props: { current: number; total: number; nowText: string; progressLabel: string }) {
  return (
    <div className="ui-stepper">
      <div
        className="ui-stepper__bar"
        style={{ gridTemplateColumns: `repeat(${props.total}, 1fr)` }}
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={props.total}
        aria-valuenow={props.current}
        aria-label={props.progressLabel}
      >
        {Array.from({ length: props.total }, (_, i) => (
          <span key={i} className={cx('ui-stepper__seg', i < props.current && 'ui-stepper__seg--on')} />
        ))}
      </div>
      <p className="ui-stepper__now">{props.nowText}</p>
    </div>
  );
}

/* ── Timeline ──────────────────────── */
export interface TimelineItem {
  key: string;
  title: string;
  desc?: ReactNode;
  state: 'done' | 'current' | 'todo' | 'bad';
  stateLabel: string;
}
export function Timeline(props: { items: TimelineItem[]; label: string }) {
  return (
    <ol className="ui-timeline" aria-label={props.label}>
      {props.items.map((it, i) => (
        <li key={it.key} aria-current={it.state === 'current' ? 'step' : undefined}>
          <span className={cx('ui-timeline__dot', it.state !== 'todo' && `ui-timeline__dot--${it.state}`)} aria-hidden>
            {it.state === 'done' ? <Check size={16} /> : it.state === 'bad' ? <X size={16} /> : i + 1}
          </span>
          <div>
            <p className="ui-timeline__title">
              {it.title} <span className="sr-only">({it.stateLabel})</span>
            </p>
            {it.desc && <div className="ui-small">{it.desc}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ── Banner ───────────────────────── */
const bannerIcon: Record<'info' | 'warning' | 'danger' | 'success', ReactNode> = {
  info: <Info size={20} aria-hidden />,
  warning: <AlertTriangle size={20} aria-hidden />,
  danger: <XCircle size={20} aria-hidden />,
  success: <CheckCircle2 size={20} aria-hidden />,
};
export function Banner(props: { tone: 'info' | 'warning' | 'danger' | 'success'; children?: ReactNode; title?: string; role?: 'status' | 'alert' }) {
  return (
    <div className={cx('ui-banner', `ui-banner--${props.tone}`)} role={props.role}>
      <span className="ui-banner__icon">{bannerIcon[props.tone]}</span>
      <div className="ui-banner__body">
        {props.title && <p className="ui-strong">{props.title}</p>}
        {props.children}
      </div>
    </div>
  );
}

/* ── EmptyState / Skeleton / Toast ─── */
export function EmptyState(props: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="ui-empty">
      {props.icon}
      <p className="ui-strong">{props.title}</p>
      {props.children}
    </div>
  );
}
export function Skeleton(props: { height?: number; width?: string; label?: string }) {
  return <div className="ui-skel" style={{ height: props.height ?? 20, width: props.width ?? '100%' }} role="status" aria-label={props.label} />;
}
export function PageSkeleton(props: { label: string }) {
  return (
    <div className="ui-stack" aria-busy="true">
      <Skeleton height={160} label={props.label} />
      <Skeleton height={72} />
      <Skeleton height={72} />
    </div>
  );
}
export function Toast(props: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!props.message) return;
    const t = setTimeout(props.onDone, 2600);
    return () => clearTimeout(t);
  }, [props.message]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!props.message) return null;
  return (
    <div className="ui-toast" role="status">
      {props.message}
    </div>
  );
}

/* ── KPI / DataTable(데스크톱) ─────── */
export function KPI(props: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="ui-kpi">
      <span className="ui-kpi__label">{props.label}</span>
      <span className="ui-kpi__value">{props.value}</span>
      {props.note && <span className="ui-kpi__note">{props.note}</span>}
    </div>
  );
}
export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  numeric?: boolean;
}
export function DataTable<T>(props: { columns: Column<T>[]; rows: T[]; caption: string; rowKey: (r: T) => string; empty?: string }) {
  return (
    <div className="ui-table-wrap" tabIndex={0} role="region" aria-label={props.caption}>
      <table className="ui-table">
        <caption className="sr-only">{props.caption}</caption>
        <thead>
          <tr>
            {props.columns.map((c) => (
              <th key={c.key} scope="col" className={c.numeric ? 'ui-num' : undefined}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.length === 0 && props.empty && (
            <tr>
              <td colSpan={props.columns.length}>{props.empty}</td>
            </tr>
          )}
          {props.rows.map((r) => (
            <tr key={props.rowKey(r)}>
              {props.columns.map((c) => (
                <td key={c.key} className={c.numeric ? 'ui-num' : undefined}>
                  {c.render(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── ProgressRing ──────────────────── */
export function ProgressRing(props: { ratio: number; big: string; small: string; label: string; full?: boolean }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const ratio = props.full ? 1 : Math.max(0, Math.min(1, props.ratio));
  return (
    <div className="ui-ring" role="img" aria-label={props.label}>
      <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden>
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--color-neutral-weak)" strokeWidth="8" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={props.full ? 'var(--color-success)' : 'var(--color-primary)'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${c * ratio} ${c}`}
        />
      </svg>
      <span className="ui-ring__label" aria-hidden>
        <span className="ui-ring__big">{props.big}</span>
        <span className="ui-ring__small">{props.small}</span>
      </span>
    </div>
  );
}

export { cx };
