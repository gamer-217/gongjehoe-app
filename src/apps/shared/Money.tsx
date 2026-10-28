import { useTranslation } from 'react-i18next';
import { AmountDisplay, formatKrw } from '../../ui';

export function Money(props: { value: number; size?: 'xl' | 'lg' | 'md' | 'sm'; hidden?: boolean; sign?: boolean; className?: string }) {
  const { t } = useTranslation();
  const v = props.value;
  return (
    <AmountDisplay
      value={v}
      size={props.size}
      hidden={props.hidden}
      sign={props.sign}
      className={props.className}
      srLabel={t('common.amountSr', { amount: (v < 0 ? '-' : '') + formatKrw(Math.abs(v)) })}
      hiddenLabel={t('common.amountHidden')}
    />
  );
}

/** 문장 속 금액 문자열(₩ 접두, 모든 언어 공통) */
export const won = (n: number) => `₩${formatKrw(n)}`;

/** 요율 0.0475 → "4.75" */
export const pct = (rate: number) => String(Math.round(rate * 10000) / 100);
