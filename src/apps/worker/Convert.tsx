// W-33 장기 체류 전환 미리보기(BR-13, 제안)
import { useTranslation } from 'react-i18next';
import { Plane, Repeat } from 'lucide-react';
import { Banner, Card } from '../../ui';
import { Money } from '../shared/Money';
import { useMember } from './WorkerApp';
import { WAppBar } from './parts';
import { NpsNotice } from './NpsTrack';

export function ConvertScreen() {
  const { t } = useTranslation();
  const { s, base } = useMember();
  if (s.track !== 'FUND') return <NpsNotice title={t('convert.title')} back={`${base}/receive`} />;
  return <FundConvertScreen />;
}

function FundConvertScreen() {
  const { t } = useTranslation();
  const { s, base } = useMember();
  return (
    <>
      <WAppBar title={t('convert.title')} back={`${base}/receive`} />
      <div className="ui-page">
        <Banner tone="warning" title={t('convert.proposal')} />
        <p>{t('convert.lead')}</p>
        <div className="ui-branch">
          <div className="ui-branch__item">
            <Plane size={24} aria-hidden />
            <p className="ui-strong">{t('convert.home')}</p>
            <p className="ui-small">{t('convert.homeDesc')}</p>
          </div>
          <div className="ui-branch__item ui-branch__item--accent">
            <Repeat size={24} aria-hidden />
            <p className="ui-strong">
              {t('convert.stay')} <span className="ui-small">{t('common.proposal')}</span>
            </p>
            <p className="ui-small">{t('convert.stayDesc', { months: s.seq })}</p>
          </div>
        </div>
        <Card>
          <div className="ui-row ui-row--between ui-row--wrap">
            <span className="ui-sub">{t('convert.amountNow')}</span>
            <Money value={s.total} size="lg" />
          </div>
        </Card>
        <p className="ui-sub">{t('convert.why')}</p>
        <p className="ui-small">{t('convert.notice')}</p>
      </div>
    </>
  );
}
