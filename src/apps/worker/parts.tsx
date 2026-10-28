import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { AppBar, BottomSheet, Button, ListenButton } from '../../ui';
import { useMember } from './WorkerApp';

/** 근로자 앱 상단 바 — 오른쪽에 언어 변경(지구본) 항상(§8.1) */
export function WAppBar(props: { title: string; back?: string; listen?: string; extra?: ReactNode }) {
  const { t, i18n } = useTranslation();
  const { base } = useMember();
  return (
    <AppBar
      title={props.title}
      backTo={props.back}
      backLabel={t('common.back')}
      actions={
        <>
          {props.extra}
          {props.listen && <ListenButton text={props.listen} lang={i18n.language} label={t('common.listen')} />}
          <Link className="ui-iconbtn" to={`${base}/me/language`} aria-label={t('common.language')}>
            <Globe size={22} aria-hidden />
          </Link>
        </>
      }
    />
  );
}

/** BR-12 보안 확인 — 생체인증 모의, 시간 제한 없음(§10.2) */
export function SecureSheet(props: { open: boolean; onClose: () => void; onConfirm: () => void; busy?: boolean }) {
  const { t } = useTranslation();
  return (
    <BottomSheet open={props.open} onClose={props.onClose} title={t('common.secure.title')} closeLabel={t('common.close')}>
      <p>{t('common.secure.body')}</p>
      <p className="ui-small">{t('common.secure.demoNote')}</p>
      <Button block onClick={props.onConfirm} disabled={props.busy}>
        {props.busy ? t('common.secure.checking') : t('common.secure.ok')}
      </Button>
    </BottomSheet>
  );
}
