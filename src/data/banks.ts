// 수령 계좌 은행 목록(W-42) — 송출국 주요 은행(선택형 입력용, 시연)
export const BANKS: Record<string, { currency: string; banks: string[] }> = {
  NP: { currency: 'NPR', banks: ['Nabil Bank', 'Nepal Investment Mega Bank', 'Global IME Bank', 'Rastriya Banijya Bank'] },
  VN: { currency: 'VND', banks: ['Vietcombank', 'BIDV', 'VietinBank', 'Agribank'] },
  ID: { currency: 'IDR', banks: ['Bank Mandiri', 'Bank Rakyat Indonesia (BRI)', 'Bank Negara Indonesia (BNI)', 'Bank Central Asia (BCA)'] },
  MM: { currency: 'MMK', banks: ['KBZ Bank', 'AYA Bank', 'CB Bank', 'Myanma Economic Bank'] },
  BD: { currency: 'BDT', banks: ['Sonali Bank', 'Islami Bank Bangladesh', 'Dutch-Bangla Bank', 'BRAC Bank'] },
  KZ: { currency: 'KZT', banks: ['Halyk Bank', 'Kaspi Bank', 'Bank CenterCredit', 'ForteBank'] },
  CN: { currency: 'CNY', banks: ['中国银行 Bank of China', '中国工商银行 ICBC', '中国建设银行 CCB', '中国农业银行 ABC'] },
};
