import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Query } from '../../data/context';
import { Banner, PageSkeleton } from '../../ui';

/** 로딩·오류 상태를 공통으로 처리(§8.2) */
export function Load<T>(props: { q: Query<T>; children: (data: T) => ReactNode }) {
  const { t } = useTranslation();
  if (props.q.status === 'loading') return <PageSkeleton label={t('common.loading')} />;
  if (props.q.status === 'error')
    return (
      <Banner tone="danger" role="alert" title={t('common.error')}>
        <p className="ui-small">{props.q.error.message}</p>
      </Banner>
    );
  return <>{props.children(props.q.data)}</>;
}
