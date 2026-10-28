// W-41 수급권자 — 지분 합 100%(BR-11), 저장 시 보안 확인(BR-12)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { equalSplit, policy, validateNominees, type Relation } from '../../domain';
import { useRepo } from '../../data/context';
import type { NewNominee } from '../../data/repository';
import { Banner, Button, Card, ChipGroup, StatusBadge } from '../../ui';
import { useMember } from './WorkerApp';
import { SecureSheet, WAppBar } from './parts';

const RELATIONS: Relation[] = ['MOTHER', 'FATHER', 'SPOUSE', 'CHILD', 'SIBLING', 'OTHER'];

export function NomineesScreen() {
  const { t } = useTranslation();
  const repo = useRepo();
  const nav = useNavigate();
  const { view, base, toast } = useMember();
  const max = policy.params.max_nominees.value;
  const [list, setList] = useState<NewNominee[]>(() => view.nominees.map(({ name, relation, share_pct, contact }) => ({ name, relation, share_pct, contact })));
  const [tried, setTried] = useState(false);
  const [secure, setSecure] = useState(false);
  const errs = validateNominees(list, policy);
  const sum = list.reduce((a, n) => a + n.share_pct, 0);
  const chips = [...new Set([...policy.params.nominee_share_chips.value, ...list.map((n) => n.share_pct).filter((v) => v > 0)])].sort((a, b) => b - a);

  const update = (i: number, patch: Partial<NewNominee>) => setList((l) => l.map((n, j) => (j === i ? { ...n, ...patch } : n)));
  const add = () => setList((l) => (l.length >= max ? l : [...l, { name: '', relation: 'MOTHER', share_pct: l.length === 0 ? 100 : 0, contact: '' }]));
  const remove = (i: number) => setList((l) => l.filter((_, j) => j !== i));
  const equal = () => setList((l) => l.map((n, i) => ({ ...n, share_pct: equalSplit(l.length)[i] })));
  const trySave = () => {
    setTried(true);
    if (errs.length === 0) setSecure(true);
  };
  const save = async () => {
    await repo.saveNominees(view.member.member_id, list.map((n) => ({ ...n, name: n.name.trim(), contact: n.contact.trim() })));
    setSecure(false);
    toast(t('nominee.saved'));
    nav(`${base}/me`);
  };

  return (
    <>
      <WAppBar title={t('nominee.title')} back={`${base}/me`} />
      <div className="ui-page">
        <p className="ui-sub">{t('nominee.intro', { max })}</p>
        {list.length === 0 && <Banner tone="warning">{t('nominee.empty')}</Banner>}
        {list.map((n, i) => {
          const saved = view.nominees.find((x) => x.name === n.name);
          return (
            <Card key={i} labelledBy={`nom-${i}`}>
              <div className="ui-card__head">
                <h2 className="ui-strong" id={`nom-${i}`}>
                  {t('nominee.person', { n: i + 1 })}
                </h2>
                {saved && <StatusBadge tone={saved.kyc_status === 'VERIFIED' ? 'success' : 'neutral'}>{t(`nominee.kycStatus.${saved.kyc_status}`)}</StatusBadge>}
              </div>
              <div className="ui-stack">
                <div className="ui-field">
                  <label htmlFor={`nm-${i}`}>{t('nominee.name')}</label>
                  <input id={`nm-${i}`} className="ui-input" value={n.name} placeholder={t('nominee.namePh')} autoComplete="off" onChange={(e) => update(i, { name: e.target.value })} />
                </div>
                <div className="ui-field">
                  <span className="ui-field__label" id={`rl-${i}`}>
                    {t('nominee.relation')}
                  </span>
                  <ChipGroup label={t('nominee.relation')} value={n.relation} onChange={(v) => update(i, { relation: v })} options={RELATIONS.map((r) => ({ value: r, label: t(`nominee.rel.${r}`) }))} />
                </div>
                <div className="ui-field">
                  <span className="ui-field__label">{t('nominee.share')}</span>
                  <ChipGroup label={t('nominee.share')} value={n.share_pct} onChange={(v) => update(i, { share_pct: v })} options={chips.map((c) => ({ value: c, label: `${c}%` }))} />
                </div>
                <div className="ui-field">
                  <label htmlFor={`ct-${i}`}>
                    {t('nominee.contact')} ({t('common.optional')})
                  </label>
                  <input id={`ct-${i}`} className="ui-input" inputMode="tel" value={n.contact} placeholder={t('nominee.contactPh')} onChange={(e) => update(i, { contact: e.target.value })} />
                </div>
                <Button variant="ghost" onClick={() => remove(i)}>
                  <Trash2 size={18} aria-hidden />
                  {t('nominee.remove')}
                </Button>
              </div>
            </Card>
          );
        })}
        <div className="ui-grid-2">
          <Button variant="secondary" onClick={add} disabled={list.length >= max}>
            <Plus size={18} aria-hidden />
            {t('nominee.add')}
          </Button>
          <Button variant="secondary" onClick={equal} disabled={list.length < 2}>
            {t('nominee.equal')}
          </Button>
        </div>
        {list.length > 0 && (
          <p className={sum === 100 ? 'ui-strong' : 'ui-field__error'} aria-live="polite">
            {t('nominee.sum', { sum })} {sum === 100 && `· ${t('nominee.sumOk')}`}
          </p>
        )}
        {tried && errs.length > 0 && (
          <Banner tone="danger" role="alert">
            {errs.map((e) => (
              <p key={e}>{t(`nominee.err.${e}`, { max })}</p>
            ))}
          </Banner>
        )}
        <p className="ui-small">{t('nominee.kyc')}</p>
        <Button block onClick={trySave}>
          {t('common.save')}
        </Button>
        <SecureSheet open={secure} onClose={() => setSecure(false)} onConfirm={save} />
      </div>
    </>
  );
}
