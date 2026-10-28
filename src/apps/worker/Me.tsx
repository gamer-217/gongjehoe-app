// W-40 내 정보
import { useTranslation } from 'react-i18next';
import { CircleHelp, Globe, Landmark, ShieldCheck, Users } from 'lucide-react';
import { formatYM } from '../../domain';
import { displayName } from '../../data/selectors';
import { LANGS } from '../../i18n';
import { Card, List, ListRow, StatusBadge } from '../../ui';
import { useMember } from './WorkerApp';
import { WAppBar } from './parts';

export function MeScreen() {
  const { t, i18n } = useTranslation();
  const { view, s, base } = useMember();
  const st = view.member.status;
  return (
    <>
      <WAppBar title={t('me.title')} />
      <div className="ui-page">
        <Card>
          <div className="ui-card__head">
            <h2 className="ui-title">{displayName(view)}</h2>
            <StatusBadge tone={st === 'ACTIVE' ? 'success' : st === 'DEPARTING' ? 'info' : 'neutral'}>{t(`me.st.${st}`)}</StatusBadge>
          </div>
          <dl className="ui-kv">
            <dt>{t('me.nationality')}</dt>
            <dd>{t(`country.${view.person.nationality_iso2}`)}</dd>
            <dt>{t('me.visa')}</dt>
            <dd>{view.visa.visa_type}</dd>
            <dt>{t('me.rid')}</dt>
            <dd className="num">{view.person.rid_masked}</dd>
            <dt>{t('me.joined')}</dt>
            <dd className="num">{formatYM(view.member.joined_ym)}</dd>
            <dt>{t('me.employer')}</dt>
            <dd>{s.currentEmployer?.employer.name}</dd>
          </dl>
        </Card>
        <h2 className="ui-section-title">{t('me.menu')}</h2>
        <List>
          <ListRow
            to={`${base}/me/nominees`}
            icon={<Users size={22} aria-hidden />}
            title={t('me.nominees')}
            desc={view.nominees.length ? t('me.nomineesDesc', { count: view.nominees.length }) : t('me.nomineesNone')}
            chevron
          />
          <ListRow to={`${base}/me/accounts`} icon={<Landmark size={22} aria-hidden />} title={t('me.accounts')} desc={s.activeAccount ? `${s.activeAccount.bank_name} ${s.activeAccount.account_masked}` : undefined} chevron />
          <ListRow to={`${base}/me/coverage`} icon={<ShieldCheck size={22} aria-hidden />} title={t('me.coverage')} desc={t('me.coverageDesc')} chevron />
          <ListRow to={`${base}/me/language`} icon={<Globe size={22} aria-hidden />} title={t('me.language')} desc={LANGS.find((l) => l.code === i18n.language)?.native} chevron />
          <ListRow to={`${base}/me/help`} icon={<CircleHelp size={22} aria-hidden />} title={t('me.help')} chevron />
        </List>
      </div>
    </>
  );
}
