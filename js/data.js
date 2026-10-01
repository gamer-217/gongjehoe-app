// 제도 파라미터 — 전부 검증된 수치만 (출처: 정책제안서 2026.10 / 팩트체크원장)
export const PARAMS = {
  worker_rate: 0.04,
  employer_rate_steps: [0.02, 0.03, 0.04],   // 시행 1년차→3년차→5년차
  gov_match: 0.10,                            // 별도 국고 (검토)
  fund_return: 0.03,                          // 보수 가정
  nps_employer_2026: 0.0475, nps_employer_2033: 0.065,
  refund_interest_2026: 0.022,                // 반환일시금 3년 정기예금이자율
  departure_insurance: 0.083,                 // 출국만기보험(존치, 별도)
  avg_wage: 2610000,                          // 월 평균임금 (경기남부 '24 조사)
};
export const WORKERS = [
  { id:"W001", name:"Ramesh", country:"NP", lang:"ne", visa:"E-9", wage:2400000, months:36 },
  { id:"W002", name:"Nguyen Van An", country:"VN", lang:"vi", visa:"E-9", wage:2610000, months:18 },
  { id:"W003", name:"Siti Rahma", country:"ID", lang:"id", visa:"E-9", wage:2500000, months:52 },
  { id:"W004", name:"김해란", country:"CN", lang:"ko", visa:"H-2", wage:2800000, months:70 },
];
export function account(w, p = PARAMS) {
  // 단리 아닌 월복리 운용 가정의 단순 모형 (프로토 시연용)
  const r = p.fund_return / 12;
  let bal = 0, worker = 0, employer = 0;
  for (let m = 0; m < w.months; m++) {
    const er = p.employer_rate_steps[Math.min(Math.floor(m / 24), 2)];
    const c = w.wage * (p.worker_rate + er);
    worker += w.wage * p.worker_rate; employer += w.wage * er;
    bal = (bal + c) * (1 + r);
  }
  return { worker, employer, gain: bal - worker - employer, total: bal };
}
