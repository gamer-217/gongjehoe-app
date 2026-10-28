// W-20 내역, W-21 명세서(§8.2)
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, FileText, TrendingUp } from 'lucide-react';
import { addMonths, balance, formatDate, formatYM, monthlyRows, ymIndex, yearOf, type LedgerEntry } from '../../domain';
import { displayName } from '../../data/selectors';
import { Button, Card, ChipGroup, EmptyState, LineChart, List, ListRow } from '../../ui';
import { Money, pct } from '../shared/Money';
import { useMember } from './WorkerApp';
import { WAppBar } from './parts';

type Item =
  | { kind: 'contrib'; key: string; ym: string; worker: number; employer: number; cum: number; employmentId: string; rate: number; posted: string }
  | { kind: 'div'; key: string; label: string; amount: number; cum: number; posted: string }
  | { kind: 'payout'; key: string; amount: number; cum: number; posted: string };

type Sep = { kind: 'sep'; key: string; tone: 'rate' | 'move' | 'gap'; text: string };

function buildItems(ledger: LedgerEntry[], billInfo: Map<string, { employmentId: string; rate: number }>): Item[] {
  const sorted = [...ledger].sort((a, b) => (a.posted_at === b.posted_at ? a.entry_id.localeCompare(b.entry_id) : a.posted_at < b.posted_at ? -1 : 1));
  const items: Item[] = [];
  const contrib = new Map<string, Extract<Item, { kind: 'contrib' }>>();
  let cum = 0;
  for (const e of sorted) {
    cum += e.amount;
    if (e.kind === 'WORKER' || e.kind === 'EMPLOYER') {
      let it = contrib.get(e.ym);
      if (!it) {
        const info = billInfo.get(e.ref_id) ?? { employmentId: '', rate: 0 };
        it = { kind: 'contrib', key: `c-${e.ym}`, ym: e.ym, worker: 0, employer: 0, cum: 0, employmentId: info.employmentId, rate: info.rate, posted: e.posted_at };
        contrib.set(e.ym, it);
        items.push(it);
      }
      if (e.kind === 'WORKER') it.worker += e.amount;
      else it.employer += e.amount;
      it.cum = cum;
    } else if (e.kind === 'DIVIDEND') {
      items.push({ kind: 'div', key: e.entry_id, label: e.ref_type === 'CLAIM' ? 'proRata' : e.ref_id, amount: e.amount, cum, posted: e.posted_at });
    } else {
      items.push({ kind: 'payout', key: e.entry_id, amount: e.amount, cum, posted: e.posted_at });
    }
  }
  return items;
}

export function HistoryScreen() {
  const { t } = useTranslation();
  const { view, base, hidden } = useMember();
  const [filter, setFilter] = useState<'all' | 'paid' | 'dividend'>('all');

  const billInfo = useMemo(() => new Map(view.bills.map((b) => [b.bill_id, { employmentId: b.employment_id, rate: b.employer_rate }])), [view.bills]);
  const items = useMemo(() => buildItems(view.ledger, billInfo), [view.ledger, billInfo]);
  const rows = useMemo(() => monthlyRows(view.ledger), [view.ledger]);
  const total = balance(view.ledger).total;
  const empName = (id: string) => view.employments.find((e) => e.employment_id === id)?.employer.name ?? '';

  // 표시 목록(최신이 위). 사업장 구간 머리말, 요율 변경·공백 구분선을 끼운다
  const desc = [...items].reverse();
  const withSeps: (Item | Sep)[] = [];
  let newer: Extract<Item, { kind: 'contrib' }> | null = null;
  for (const it of desc) {
    if (it.kind === 'contrib') {
      if (!newer || newer.employmentId !== it.employmentId)
        withSeps.push({ kind: 'sep', key: `mv-${it.ym}`, tone: 'move', text: t('history.employerChange', { name: empName(it.employmentId) }) });
      else if (newer.rate !== it.rate) withSeps.push({ kind: 'sep', key: `rt-${newer.ym}`, tone: 'rate', text: t('history.rateChange', { rate: pct(newer.rate) }) });
      newer = it;
    }
    withSeps.push(it);
    if (it.kind === 'contrib') {
      // 바로 아래(이전 달) 납입과의 공백
      const older = desc.slice(desc.indexOf(it) + 1).find((x): x is Extract<Item, { kind: 'contrib' }> => x.kind === 'contrib');
      if (older)
        for (let k = ymIndex(it.ym) - 1; k > ymIndex(older.ym); k--) {
          const ym = addMonths(older.ym, k - ymIndex(older.ym));
          withSeps.push({ kind: 'sep', key: `gap-${ym}`, tone: 'gap', text: t('history.gap', { ym: formatYM(ym) }) });
        }
    }
  }
  const display = withSeps.filter((x) => {
    if (filter === 'paid') return x.kind === 'contrib' || (x.kind === 'sep' && x.tone !== 'gap');
    if (filter === 'dividend') return x.kind === 'div';
    return true;
  });

  return (
    <>
      <WAppBar title={t('history.title')} />
      <div className="ui-page">
        {items.length === 0 ? (
          <EmptyState icon={<FileText size={40} aria-hidden />} title={t('history.empty')} />
        ) : (
          <>
            <Card>
              <div className="ui-card__head">
                <span className="ui-sub">{t('history.current')}</span>
                <Money value={total} size="lg" hidden={hidden} />
              </div>
              <LineChart
                label={t('history.chart')}
                series={[{ name: t('history.cumulative'), color: 'var(--color-primary)', values: rows.map((r) => r.cumulative) }]}
                xLabels={rows.map((r) => formatYM(r.ym))}
                area
                height={100}
              />
            </Card>
            <div className="ui-row ui-row--between ui-row--wrap">
              <ChipGroup
                label={t('history.filter')}
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: t('history.all') },
                  { value: 'paid', label: t('history.paid') },
                  { value: 'dividend', label: t('history.dividend') },
                ]}
              />
            </div>
            <div className="ui-list">
              {display.map((x) => {
                if (x.kind === 'sep')
                  return (
                    <div key={x.key} className={`ui-divider-label ui-divider-label--${x.tone === 'rate' ? 'rate' : 'move'}`}>
                      {x.tone === 'rate' ? <TrendingUp size={16} aria-hidden /> : <ArrowRightLeft size={16} aria-hidden />}
                      {x.text}
                    </div>
                  );
                if (x.kind === 'contrib')
                  return (
                    <div key={x.key} className="ui-ledger-row">
                      <span className="ui-ledger-row__ym">{formatYM(x.ym)}</span>
                      <span className="ui-ledger-row__parts">
                        {hidden ? '••••' : t('history.rowParts', { worker: x.worker.toLocaleString('en-US'), employer: x.employer.toLocaleString('en-US') })}
                      </span>
                      <span className="ui-ledger-row__cum">
                        <Money value={x.cum} size="sm" hidden={hidden} />
                      </span>
                    </div>
                  );
                return (
                  <div key={x.key} className="ui-ledger-row">
                    <span className="ui-ledger-row__ym">{formatDate(x.posted).slice(0, 7)}</span>
                    <span className="ui-ledger-row__parts">
                      {x.kind === 'div' ? (x.label === 'proRata' ? t('history.proRata') : t('history.dividendRow', { year: x.label })) : t('history.payout')}
                      {x.kind === 'div' && (
                        <>
                          {' · '}
                          <Money value={x.amount} size="sm" sign hidden={hidden} />
                          <span className="ui-small"> ({t('common.demoDividend')})</span>
                        </>
                      )}
                    </span>
                    <span className="ui-ledger-row__cum">
                      <Money value={x.cum} size="sm" hidden={hidden} />
                    </span>
                  </div>
                );
              })}
            </div>
            <List>
              <ListRow to={`${base}/history/statement`} icon={<FileText size={22} aria-hidden />} title={t('history.statement')} chevron />
            </List>
          </>
        )}
      </div>
    </>
  );
}

export function StatementScreen() {
  const { t } = useTranslation();
  const { view, base } = useMember();
  const years = [...new Set(view.ledger.map((e) => yearOf(e.ym)))].sort((a, b) => b - a);
  const [year, setYear] = useState<number | null>(years[0] ?? null);
  const [open, setOpen] = useState(false);
  const rows = monthlyRows(view.ledger).filter((r) => year !== null && yearOf(r.ym) === year);
  const sum = rows.reduce((a, r) => ({ w: a.w + r.worker, e: a.e + r.employer, d: a.d + r.dividend }), { w: 0, e: 0, d: 0 });
  const yearEnd = year ? balance(view.ledger, `${year}-12-31`).total : 0;
  const n = (v: number) => v.toLocaleString('en-US');
  return (
    <>
      <WAppBar title={t('statement.title')} back={`${base}/history`} />
      <div className="ui-page">
        <ChipGroup label={t('statement.chooseYear')} value={year} onChange={(y) => { setYear(y); setOpen(false); }} options={years.map((y) => ({ value: y, label: String(y) }))} />
        {!open ? (
          <Button block onClick={() => setOpen(true)} disabled={!year}>
            {t('statement.open')}
          </Button>
        ) : (
          <article className="ui-print ui-stack" aria-labelledby="st-h">
            <h2 className="ui-title" id="st-h">
              {t('statement.heading', { year })}
            </h2>
            <dl className="ui-kv">
              <dt>{t('statement.name')}</dt>
              <dd>{displayName(view)}</dd>
              <dt>{t('statement.member')}</dt>
              <dd>{view.member.member_id}</dd>
            </dl>
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th scope="col">{t('statement.month')}</th>
                    <th scope="col" className="ui-num">{t('statement.worker')}</th>
                    <th scope="col" className="ui-num">{t('statement.employer')}</th>
                    <th scope="col" className="ui-num">{t('statement.dividend')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.ym}>
                      <td>{formatYM(r.ym)}</td>
                      <td className="ui-num">{n(r.worker)}</td>
                      <td className="ui-num">{n(r.employer)}</td>
                      <td className="ui-num">{n(r.dividend)}</td>
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">{t('statement.sum')}</th>
                    <td className="ui-num ui-strong">{n(sum.w)}</td>
                    <td className="ui-num ui-strong">{n(sum.e)}</td>
                    <td className="ui-num ui-strong">{n(sum.d)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="ui-row ui-row--between">
              <span className="ui-sub">{t('statement.yearEnd', { year })}</span>
              <Money value={yearEnd} size="lg" />
            </div>
            <p className="ui-small">{t('statement.note')}</p>
            <div className="ui-noprint">
              <Button variant="secondary" block onClick={() => window.print()}>
                {t('statement.print')}
              </Button>
            </div>
          </article>
        )}
        <p className="ui-small">
          <Link to={`${base}/history`}>{t('common.back')}</Link>
        </p>
      </div>
    </>
  );
}
