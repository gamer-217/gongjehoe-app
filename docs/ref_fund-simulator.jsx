import React, { useState, useMemo } from "react";
import {
  ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Cell,
} from "recharts";

/* ── 색 토큰: petrol(기금·안정) + gold(적립·수익) + clay(적자·경고) ── */
const C = {
  bg: "#EFF2F1", surface: "#FFFFFF", ink: "#15211E", sub: "#5B6B67",
  line: "#DDE4E2", petrol: "#0C5249", petrolDeep: "#0A3A34",
  gold: "#B5851A", goldSoft: "#E7D7AC", clay: "#B23A2E", ocb: "#9A7B3A",
};

/* ── 코호트 기반 수입–지출 균형 모델 ── */
function simulate(p) {
  const { N, D, wageM, g, wRate, eRate, govRate, ret, admin, exitRate } = p;
  let cohorts = [], govBuf = 0, cumAdmin = 0, prevFund = 0;
  const rows = []; let breakeven = null;
  for (let t = 1; t <= 30; t++) {
    const wage = wageM * 1e4 * Math.pow(1 + g / 100, t - 1);
    const contribPP = wage * 12 * (wRate + eRate) / 100;
    cohorts.forEach((c) => (c.bal *= 1 + ret / 100));
    govBuf *= 1 + ret / 100;
    cohorts.push({ entryT: t, size: N, bal: 0 });
    let totalContrib = 0;
    cohorts.forEach((c) => { c.bal += contribPP; totalContrib += contribPP * c.size; });
    const govY = totalContrib * govRate / 100; govBuf += govY;
    let refund = 0, exitCnt = 0;
    cohorts.forEach((c) => {
      if (t - c.entryT + 1 >= D) {
        const out = c.size * exitRate / 100;
        refund += c.bal * out; exitCnt += out; c.size -= out;
      }
    });
    cohorts = cohorts.filter((c) => c.size > 1);
    const adminY = (totalContrib + govY) * admin / 100; cumAdmin += adminY;
    const fund = cohorts.reduce((s, c) => s + c.bal * c.size, 0) + govBuf - cumAdmin;
    const net = fund - prevFund;
    if (breakeven === null && t > 2 && net > 0 && rows.some((r) => r.net < 0)) breakeven = t;
    rows.push({
      year: t,
      fund: +(fund / 1e12).toFixed(2),
      net: Math.round(net / 1e8),
      refund: Math.round(refund / 1e8),
      residents: Math.round(cohorts.reduce((s, c) => s + c.size, 0) / 1e4),
    });
    prevFund = fund;
  }
  return { rows, breakeven };
}

/* 논문 표4 OCB 기준선(조원) — 결정론적 추계, 보간 */
const OCB_PTS = { 1: 0.42, 2: 1.30, 3: 2.65, 4: 2.25, 5: 2.32, 10: 5.4, 20: 18.0, 30: 27.0 };
function ocbAt(y) {
  const keys = Object.keys(OCB_PTS).map(Number).sort((a, b) => a - b);
  if (OCB_PTS[y] != null) return OCB_PTS[y];
  let lo = keys[0], hi = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) if (keys[i] <= y && y <= keys[i + 1]) { lo = keys[i]; hi = keys[i + 1]; }
  const f = (y - lo) / (hi - lo);
  return +(OCB_PTS[lo] + f * (OCB_PTS[hi] - OCB_PTS[lo])).toFixed(2);
}

const won = (조) => `${조.toFixed(1)}조`;

function Slider({ label, unit, value, min, max, step, onChange, hint }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 15, color: C.ink, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          {value}<span style={{ fontSize: 11, color: C.sub, fontWeight: 500, marginLeft: 2 }}>{unit}</span>
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ width: "100%", accentColor: C.petrol, height: 4, cursor: "pointer" }} />
      {hint && <div style={{ fontSize: 11, color: "#92A09C", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function Kpi({ label, value, accent, sub }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 18px", flex: 1 }}>
      <div style={{ fontSize: 12, color: C.sub, marginBottom: 8, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent || C.ink, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#92A09C", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function FundSimulator() {
  const [p, setP] = useState({
    N: 11.2, D: 4, wageM: 261, g: 3, wRate: 4, eRate: 4, govRate: 10, ret: 3, admin: 1.5, exitRate: 65,
  });
  const set = (k) => (v) => setP((s) => ({ ...s, [k]: v }));

  const { rows, breakeven } = useMemo(
    () => simulate({ ...p, N: p.N * 1e4 }), [p]
  );
  const data = rows.map((r) => ({ ...r, ocb: ocbAt(r.year), gap: +(ocbAt(r.year) - r.fund).toFixed(2) }));
  const fund10 = rows[9].fund, fund30 = rows[29].fund;
  const gap30 = +(ocbAt(30) - fund30).toFixed(1);
  const worstNet = Math.min(...rows.map((r) => r.net));
  const worstYear = rows.find((r) => r.net === worstNet)?.year;

  return (
    <div style={{ background: C.bg, padding: "28px 24px 36px", fontFamily: "'Inter','Pretendard',-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif", color: C.ink }}>
      {/* 헤더 */}
      <div style={{ maxWidth: 1180, margin: "0 auto 24px" }}>
        <div style={{ fontSize: 12, letterSpacing: "0.14em", color: C.petrol, fontWeight: 700, marginBottom: 8 }}>
          외국인근로자공제회 · 재정 지속가능성 시뮬레이터
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
          30년 수입–지출 균형 모델
        </h1>
        <p style={{ fontSize: 14, color: C.sub, margin: 0, maxWidth: 720, lineHeight: 1.55 }}>
          코호트별 적립·운용·환급을 동태적으로 추적하는 일관 모델. 점선은 논문(KCI)의 결정론적
          OCB 추계로, 두 곡선의 간극이 곧 결정론적 추정의 과대편의를 드러낸다.
        </p>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "300px 1fr", gap: 22 }}>
        {/* 좌: 가정 변수 */}
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: "20px 20px 8px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: C.ink }}>가정 변수 (OCB 기준값)</div>
          <Slider label="연간 신규 가입자" unit="만명" value={p.N} min={5} max={20} step={0.1} onChange={set("N")} hint="E-9 도입 규모의 70% 수준" />
          <Slider label="평균 수급(체류) 기간" unit="년" value={p.D} min={2} max={6} step={1} onChange={set("D")} hint="재입국 특례 반영" />
          <Slider label="출국률 (환급 발생)" unit="%" value={p.exitRate} min={40} max={100} step={5} onChange={set("exitRate")} hint="잔여는 재입국·연장" />
          <Slider label="근로자 기여율" unit="%" value={p.wRate} min={0} max={8} step={0.5} onChange={set("wRate")} />
          <Slider label="고용주 기여율" unit="%" value={p.eRate} min={0} max={8} step={0.5} onChange={set("eRate")} hint="단계적 2→4% 도입 검토" />
          <Slider label="정부 매칭 지원" unit="%" value={p.govRate} min={0} max={20} step={1} onChange={set("govRate")} hint="미청구 낙전수입 재분배" />
          <Slider label="기금 운용 수익률" unit="%" value={p.ret} min={1} max={7} step={0.5} onChange={set("ret")} hint="NPS 장기 6.82% 대비 보수적" />
          <Slider label="초기 평균임금" unit="만원" value={p.wageM} min={200} max={350} step={1} onChange={set("wageM")} />
          <Slider label="임금 상승률" unit="%" value={p.g} min={0} max={6} step={0.5} onChange={set("g")} />
        </div>

        {/* 우: 결과 */}
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <Kpi label="10년 차 누적 기금" value={won(fund10)} accent={C.petrol} sub={`논문 OCB ${won(ocbAt(10))}`} />
            <Kpi label="30년 차 누적 기금" value={won(fund30)} accent={C.petrol} sub={`논문 OCB ${won(ocbAt(30))}`} />
            <Kpi label="결정론 추계와의 간극" value={`${gap30 > 0 ? "−" : "+"}${Math.abs(gap30).toFixed(1)}조`} accent={C.gold} sub="30년 차 OCB − 일관모델" />
            <Kpi label={`최저 연간수지 (${worstYear}년차)`} value={`${worstNet >= 0 ? "+" : "−"}${Math.abs(worstNet).toLocaleString()}억`} accent={worstNet < 0 ? C.clay : C.petrol} sub={worstNet < 0 ? "만기 환급 충격 구간" : "전 구간 흑자"} />
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: "18px 14px 8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 8px 10px" }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>누적 기금 & 연간 수지</div>
              <div style={{ display: "flex", gap: 16, fontSize: 11, color: C.sub }}>
                <Legend2 c={C.petrol} t="누적 기금(일관모델)" fill />
                <Legend2 c={C.ocb} t="누적 기금(논문 OCB)" dash />
                <Legend2 c={C.gold} t="연간 수지" bar />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart data={data} margin={{ top: 8, right: 14, left: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="fundFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.petrol} stopOpacity={0.34} />
                    <stop offset="100%" stopColor={C.petrol} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: C.sub }} tickLine={false} axisLine={{ stroke: C.line }}
                  ticks={[1, 5, 10, 15, 20, 25, 30]} tickFormatter={(v) => `${v}년`} />
                <YAxis yAxisId="L" tick={{ fontSize: 11, fill: C.sub }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${v}조`} />
                <YAxis yAxisId="R" orientation="right" tick={{ fontSize: 11, fill: "#A9968F" }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${(v / 1e4).toFixed(0)}조`} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 12, fontVariantNumeric: "tabular-nums" }}
                  formatter={(val, name) => {
                    if (name === "누적 기금") return [`${val}조원`, name];
                    if (name === "논문 OCB") return [`${val}조원`, name];
                    if (name === "연간 수지") return [`${val.toLocaleString()}억원`, name];
                    return [val, name];
                  }}
                  labelFormatter={(l) => `${l}년 차`} />
                <ReferenceLine yAxisId="R" y={0} stroke={C.line} />
                <Bar yAxisId="R" dataKey="net" name="연간 수지" radius={[2, 2, 0, 0]} maxBarSize={16}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.net < 0 ? C.clay : C.goldSoft} />
                  ))}
                </Bar>
                <Area yAxisId="L" type="monotone" dataKey="fund" name="누적 기금" stroke={C.petrol} strokeWidth={2.4} fill="url(#fundFill)" />
                <Line yAxisId="L" type="monotone" dataKey="ocb" name="논문 OCB" stroke={C.ocb} strokeWidth={1.8} strokeDasharray="5 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
            <Note title="유동성 순환" body={`${p.D}년 차 만기 도래로 환급 충격이 발생하나, 누적 기금이 이를 흡수하며 고갈 없이 순환한다.`} />
            <Note title="운용 거버넌스" body="수익률 1%p 변동이 30년 기금 규모를 좌우한다. 전문 운용체계가 지속가능성의 핵심 선결조건이다." />
            <Note title="해석" body={`일관모델은 논문 OCB 대비 30년 차 약 ${Math.abs(gap30).toFixed(0)}조 보수적. 결정론 추계의 운용수익 과대계상이 간극의 원인으로 추정된다.`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend2({ c, t, fill, dash, bar }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{
        width: 16, height: dash ? 0 : (bar ? 9 : 9), borderTop: dash ? `2px dashed ${c}` : "none",
        background: dash ? "none" : c, borderRadius: bar ? 1 : 2, opacity: fill ? 0.6 : 1, display: "inline-block",
      }} />
      {t}
    </span>
  );
}
function Note({ title, body }) {
  return (
    <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: "13px 15px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.petrol, marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}
