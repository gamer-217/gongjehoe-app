// W-42 수령 계좌 — 나라 → 은행(목록) → 계좌번호(공백·하이픈 허용) → 예금주 확인 → 보안 확인
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Landmark, Plus } from 'lucide-react';
import { isValidAccountNumber, normalizeAccountNumber } from '../../domain';
import { useRepo } from '../../data/context';
import { BANKS } from '../../data/banks';
import { Banner, Button, Card, ChipGroup, EmptyState, List, ListRow, StatusBadge } from '../../ui';
import { SecureSheet, WAppBar } from './parts';
import { useMember } from './WorkerApp';

export function AccountsScreen() {
  const { t } = useTranslation();
  const repo = useRepo();
  const { view, base, toast } = useMember();
  const [adding, setAdding] = useState(view.bankAccounts.length === 0);
  const [country, setCountry] = useState(view.person.nationality_iso2 in BANKS ? view.person.nationality_iso2 : 'NP');
  const [bank, setBank] = useState<string | null>(null);
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState(view.person.name_latin.toUpperCase());
  const [holderOk, setHolderOk] = useState(false);
  const [tried, setTried] = useState(false);
  const [secure, setSecure] = useState(false);
  const numOk = isValidAccountNumber(number);
  const ready = !!bank && numOk && holderOk;

  const save = async () => {
    await repo.addBankAccount(view.member.member_id, { country_iso2: country, bank_name: bank!, account_number: number, holder_name: holder, currency: BANKS[country].currency });
    setSecure(false);
    setAdding(false);
    setBank(null);
    setNumber('');
    setHolderOk(false);
    setTried(false);
    toast(t('account.saved'));
  };

  return (
    <>
      <WAppBar title={t('account.title')} back={`${base}/me`} />
      <div className="ui-page">
        {view.bankAccounts.length === 0 && !adding && <EmptyState icon={<Landmark size={40} aria-hidden />} title={t('account.empty')} />}
        {view.bankAccounts.length > 0 && (
          <List label={t('account.title')}>
            {view.bankAccounts.map((a) => (
              <ListRow
                key={a.id}
                icon={<Landmark size={22} aria-hidden />}
                title={a.bank_name}
                desc={`${a.account_masked} · ${a.currency} · ${a.holder_name}`}
                end={
                  a.active ? (
                    <StatusBadge tone="success">{t('account.inUse')}</StatusBadge>
                  ) : (
                    <Button variant="ghost" onClick={() => repo.setActiveBankAccount(view.member.member_id, a.id)}>
                      {t('account.use')}
                    </Button>
                  )
                }
              />
            ))}
          </List>
        )}
        {!adding ? (
          <Button variant="secondary" block onClick={() => setAdding(true)}>
            <Plus size={18} aria-hidden />
            {t('account.add')}
          </Button>
        ) : (
          <Card labelledBy="add-h">
            <h2 className="ui-strong" id="add-h">
              {t('account.add')}
            </h2>
            <div className="ui-stack ui-mt">
              <div className="ui-field">
                <span className="ui-field__label">{t('account.country')}</span>
                <ChipGroup
                  label={t('account.country')}
                  value={country}
                  onChange={(c) => {
                    setCountry(c);
                    setBank(null);
                  }}
                  options={Object.keys(BANKS).map((c) => ({ value: c, label: t(`country.${c}`) }))}
                />
              </div>
              <div className="ui-field">
                <label htmlFor="bank">{t('account.bank')}</label>
                <select id="bank" className="ui-select" value={bank ?? ''} onChange={(e) => setBank(e.target.value || null)}>
                  <option value="">{t('account.bankPh')}</option>
                  {BANKS[country].banks.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ui-field">
                <label htmlFor="acno">{t('account.number')}</label>
                <input id="acno" className="ui-input num" inputMode="numeric" autoComplete="off" value={number} onChange={(e) => setNumber(e.target.value)} aria-describedby="acno-h" />
                <span className="ui-field__hint" id="acno-h">
                  {t('account.numberHint')}
                </span>
                {number && numOk && <span className="ui-field__hint num">{t('account.cleaned', { number: normalizeAccountNumber(number) })}</span>}
                {(tried || number.length > 3) && !numOk && <span className="ui-field__error">{t('account.numberErr')}</span>}
              </div>
              <div className="ui-field">
                <label htmlFor="holder">{t('account.holder')}</label>
                <input
                  id="holder"
                  className="ui-input"
                  autoComplete="off"
                  value={holder}
                  onChange={(e) => {
                    setHolder(e.target.value);
                    setHolderOk(false);
                  }}
                  aria-describedby="holder-h"
                />
                <span className="ui-field__hint" id="holder-h">
                  {t('account.holderHint')}
                </span>
                {holderOk ? (
                  <span className="ui-row ui-strong">
                    <CheckCircle2 size={18} color="var(--color-success)" aria-hidden />
                    {t('account.holderOk')}
                  </span>
                ) : (
                  <Button variant="secondary" onClick={() => setHolderOk(holder.trim().length > 1)}>
                    {t('account.holderCheck')}
                  </Button>
                )}
              </div>
              {tried && !ready && (
                <Banner tone="danger" role="alert">
                  {!holderOk ? t('account.holderNeed') : !numOk ? t('account.numberErr') : t('account.bankPh')}
                </Banner>
              )}
              <Button
                block
                onClick={() => {
                  setTried(true);
                  if (ready) setSecure(true);
                }}
              >
                {t('account.save')}
              </Button>
            </div>
          </Card>
        )}
        <SecureSheet open={secure} onClose={() => setSecure(false)} onConfirm={save} />
      </div>
    </>
  );
}
