import React, { useState } from "react";

/* 시뮬레이터와 동일한 브랜드 토큰 */
const C = {
  ink: "#15211E", sub: "#5B6B67", line: "#E4E9E7", bg: "#EFF2F1",
  petrol: "#0C5249", petrolDeep: "#0A3A34", petrolMid: "#0E5C53",
  gold: "#B5851A", goldSoft: "#E7D7AC", clay: "#B23A2E",
  mint: "#1F8A6E", paper: "#FFFFFF",
};

/* 다국어 — E-9 주요 송출국 */
const L = {
  ko: { name: "한국어", greet: "안녕하세요", total: "내 적립금", principal: "납입 원금", yield: "운용 수익",
    thisMonth: "이번 달 적립", worker: "근로자", employer: "고용주", gov: "정부 매칭", dday: "환급 예정까지",
    home: "홈", history: "적립 이력", refund: "환급", bridge: "연금 연계",
    refundTitle: "출국 시 받을 금액", guaranteed: "전액(100%) 환급 보장", steps: "환급 절차",
    s1: "출국 신고", s2: "계좌 확인", s3: "3일 내 입금", apply: "환급 신청하기",
    bridgeTitle: "장기 체류로 전환되셨네요", bridgeBody: "E-7-4 비자 전환이 확인되었습니다. 두 가지 중 선택하세요.",
    optA: "지금 전액 환급받기", optAd: "적립금 즉시 수령", optB: "국민연금으로 이체", optBd: "가입기간 합산 · 노령연금 수급권",
    monthLabel: "월 적립", qLabel: "분기 운용수익" },
  en: { name: "English", greet: "Hello", total: "My Savings", principal: "Principal", yield: "Returns",
    thisMonth: "This month", worker: "Worker", employer: "Employer", gov: "Gov. match", dday: "Until payout",
    home: "Home", history: "History", refund: "Refund", bridge: "Pension link",
    refundTitle: "Amount on departure", guaranteed: "100% guaranteed refund", steps: "Refund steps",
    s1: "Departure notice", s2: "Verify account", s3: "Paid in 3 days", apply: "Request refund",
    bridgeTitle: "You've moved to long-term stay", bridgeBody: "E-7-4 visa change detected. Choose one option.",
    optA: "Refund in full now", optAd: "Receive savings instantly", optB: "Transfer to pension", optBd: "Counted toward pension eligibility",
    monthLabel: "Monthly", qLabel: "Quarterly returns" },
  vi: { name: "Tiếng Việt", greet: "Xin chào", total: "Tiền tích lũy", principal: "Gốc đã nộp", yield: "Lợi nhuận",
    thisMonth: "Tháng này", worker: "Người LĐ", employer: "Chủ SDLĐ", gov: "Nhà nước", dday: "Đến khi hoàn trả",
    home: "Trang chủ", history: "Lịch sử", refund: "Hoàn tiền", bridge: "Liên kết",
    refundTitle: "Số tiền khi xuất cảnh", guaranteed: "Hoàn trả 100%", steps: "Quy trình",
    s1: "Khai báo xuất cảnh", s2: "Xác minh TK", s3: "Trả trong 3 ngày", apply: "Yêu cầu hoàn",
    bridgeTitle: "Bạn đã chuyển cư trú dài hạn", bridgeBody: "Phát hiện đổi visa E-7-4. Chọn một.",
    optA: "Hoàn toàn bộ ngay", optAd: "Nhận tiền ngay", optB: "Chuyển sang lương hưu", optBd: "Cộng dồn thời gian hưu trí",
    monthLabel: "Hàng tháng", qLabel: "Lợi nhuận quý" },
  ne: { name: "नेपाली", greet: "नमस्ते", total: "मेरो बचत", principal: "मूल रकम", yield: "प्रतिफल",
    thisMonth: "यो महिना", worker: "कामदार", employer: "रोजगारदाता", gov: "सरकार", dday: "फिर्तासम्म",
    home: "गृह", history: "इतिहास", refund: "फिर्ता", bridge: "पेन्सन",
    refundTitle: "प्रस्थानमा पाउने रकम", guaranteed: "१००% फिर्ता ग्यारेन्टी", steps: "प्रक्रिया",
    s1: "प्रस्थान सूचना", s2: "खाता पुष्टि", s3: "३ दिनमा भुक्तानी", apply: "फिर्ता अनुरोध",
    bridgeTitle: "तपाईं दीर्घकालीन बसाइँमा", bridgeBody: "E-7-4 भिसा परिवर्तन पत्ता लाग्यो। एउटा छान्नुहोस्।",
    optA: "अहिले पूरै फिर्ता", optAd: "तुरुन्तै रकम", optB: "पेन्सनमा सार्ने", optBd: "योगदान अवधि गणना",
    monthLabel: "मासिक", qLabel: "त्रैमासिक प्रतिफल" },
};

const won = (n) => "₩" + n.toLocaleString();

/* 적립 데이터 */
const HISTORY = [
  { m: "2026.06", w: 104400, e: 104400, g: 20880, type: "m" },
  { m: "2026.05", w: 104400, e: 104400, g: 20880, type: "m" },
  { m: "2026.04", w: 104400, e: 104400, g: 20880, type: "m" },
  { m: "2026.03", w: 0, e: 0, g: 0, type: "q", q: 132500 },
  { m: "2026.03", w: 104400, e: 104400, g: 20880, type: "m" },
  { m: "2026.02", w: 102000, e: 102000, g: 20400, type: "m" },
];
const PRINCIPAL = 7980000, YIELD = 442800;
const TOTAL = PRINCIPAL + YIELD;

function StatusBar() {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 20px 4px", fontSize: 12, color: "#fff", fontWeight: 600 }}>
      <span>9:41</span>
      <span style={{ display: "flex", gap: 5, opacity: 0.9 }}>
        <span>●●●</span><span>📶</span><span>100%</span>
      </span>
    </div>
  );
}

function Phone({ children, lang, setLang, t }) {
  return (
    <div style={{ width: 380, background: C.bg, borderRadius: 40, overflow: "hidden",
      boxShadow: "0 30px 70px -20px rgba(10,58,52,0.4), 0 0 0 11px #11201D, 0 0 0 12px #2A3A36",
      position: "relative" }}>
      {/* 헤더 */}
      <div style={{ background: `linear-gradient(160deg, ${C.petrolDeep}, ${C.petrolMid})`, paddingBottom: 18 }}>
        <StatusBar />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 22px 0" }}>
          <div>
            <div style={{ fontSize: 11, color: "#9DC4BB", letterSpacing: "0.08em", fontWeight: 600 }}>외국인근로자공제회</div>
            <div style={{ fontSize: 17, color: "#fff", fontWeight: 700, marginTop: 2 }}>{t.greet}, Nguyen V.A</div>
          </div>
          <select value={lang} onChange={(e) => setLang(e.target.value)}
            style={{ background: "rgba(255,255,255,0.14)", color: "#fff", border: "none", borderRadius: 9,
              padding: "6px 8px", fontSize: 12, fontWeight: 600, cursor: "pointer", appearance: "none", textAlign: "center" }}>
            {Object.entries(L).map(([k, v]) => <option key={k} value={k} style={{ color: "#000" }}>{v.name}</option>)}
          </select>
        </div>
      </div>
      <div style={{ minHeight: 540, maxHeight: 540, overflowY: "auto" }}>{children}</div>
    </div>
  );
}

function Home({ t }) {
  return (
    <div style={{ padding: "0 18px 20px", marginTop: -8 }}>
      {/* 적립금 메인 카드 — 시그니처 */}
      <div style={{ background: C.paper, borderRadius: 20, padding: "20px 20px 18px", boxShadow: "0 8px 24px -12px rgba(12,82,73,0.25)", marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>{t.total}</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: C.ink, letterSpacing: "-0.02em", margin: "4px 0 14px", fontVariantNumeric: "tabular-nums" }}>{won(TOTAL)}</div>
        {/* 원금 + 수익 스택 바 */}
        <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", marginBottom: 10 }}>
          <div style={{ width: `${PRINCIPAL / TOTAL * 100}%`, background: C.petrol }} />
          <div style={{ flex: 1, background: C.gold }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.sub }}>
            <i style={{ width: 8, height: 8, borderRadius: 2, background: C.petrol }} /> {t.principal} <b style={{ color: C.ink, fontVariantNumeric: "tabular-nums" }}>{won(PRINCIPAL)}</b>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.sub }}>
            <i style={{ width: 8, height: 8, borderRadius: 2, background: C.gold }} /> {t.yield} <b style={{ color: C.gold, fontVariantNumeric: "tabular-nums" }}>+{won(YIELD)}</b>
          </span>
        </div>
      </div>

      {/* D-day */}
      <div style={{ background: `linear-gradient(135deg, ${C.petrol}, ${C.mint})`, borderRadius: 16, padding: "15px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 12, color: "#Bfe3d9" }}>{t.dday}</div>
          <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginTop: 2 }}>2027.04.22</div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums" }}>D-296</div>
      </div>

      {/* 이번 달 기여 */}
      <div style={{ background: C.paper, borderRadius: 16, padding: "16px 18px", boxShadow: "0 6px 18px -14px rgba(0,0,0,0.2)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: C.ink }}>{t.thisMonth}</div>
        {[[t.worker, 104400, C.petrol], [t.employer, 104400, C.petrolMid], [t.gov, 20880, C.gold]].map(([lab, val, col], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: i ? `1px solid ${C.line}` : "none" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.sub }}>
              <i style={{ width: 6, height: 6, borderRadius: 3, background: col }} />{lab}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{won(val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function History({ t }) {
  return (
    <div style={{ padding: "10px 18px 20px" }}>
      <div style={{ fontSize: 16, fontWeight: 800, margin: "4px 4px 14px", color: C.ink }}>{t.history}</div>
      {HISTORY.map((h, i) => h.type === "q" ? (
        <div key={i} style={{ background: "#FBF6E9", border: `1px solid ${C.goldSoft}`, borderRadius: 14, padding: "13px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{t.qLabel}</div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{h.m}</div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.gold, fontVariantNumeric: "tabular-nums" }}>+{won(h.q)}</div>
        </div>
      ) : (
        <div key={i} style={{ background: C.paper, borderRadius: 14, padding: "13px 16px", marginBottom: 10, boxShadow: "0 4px 12px -10px rgba(0,0,0,0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{h.m}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.petrol, fontVariantNumeric: "tabular-nums" }}>+{won(h.w + h.e + h.g)}</span>
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 11, color: C.sub }}>
            <span>{t.worker} {won(h.w)}</span><span>·</span><span>{t.employer} {won(h.e)}</span><span>·</span><span>{t.gov} {won(h.g)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Refund({ t }) {
  return (
    <div style={{ padding: "10px 18px 20px" }}>
      <div style={{ background: C.paper, borderRadius: 20, padding: "22px 20px", textAlign: "center", boxShadow: "0 8px 24px -14px rgba(12,82,73,0.3)", marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: C.sub }}>{t.refundTitle}</div>
        <div style={{ fontSize: 38, fontWeight: 800, color: C.petrol, margin: "6px 0 12px", fontVariantNumeric: "tabular-nums" }}>{won(TOTAL)}</div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#E7F2EE", color: C.mint, fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 20 }}>
          ✓ {t.guaranteed}
        </span>
      </div>
      <div style={{ background: C.paper, borderRadius: 16, padding: "16px 18px", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: C.ink }}>{t.steps}</div>
        {[t.s1, t.s2, t.s3].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < 2 ? 14 : 0, position: "relative" }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: i === 2 ? C.mint : C.petrol, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
            <span style={{ fontSize: 14, color: C.ink, fontWeight: 500 }}>{s}</span>
            {i === 2 && <span style={{ marginLeft: "auto", fontSize: 11, color: C.mint, fontWeight: 700 }}>⚡ i-Akaun</span>}
          </div>
        ))}
      </div>
      <button style={{ width: "100%", padding: "15px", background: C.petrol, color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>{t.apply}</button>
    </div>
  );
}

function Bridge({ t }) {
  return (
    <div style={{ padding: "10px 18px 20px" }}>
      <div style={{ background: `linear-gradient(140deg, ${C.gold}, #9A6E12)`, borderRadius: 18, padding: "18px 20px", color: "#fff", marginBottom: 16 }}>
        <div style={{ fontSize: 22, marginBottom: 6 }}>🔗</div>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{t.bridgeTitle}</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "#FBF3E0" }}>{t.bridgeBody}</div>
      </div>
      {[
        { title: t.optA, desc: t.optAd, val: won(TOTAL), col: C.petrol, badge: "E-9" },
        { title: t.optB, desc: t.optBd, val: "+3.2년", col: C.mint, badge: "E-7-4", rec: true },
      ].map((o, i) => (
        <div key={i} style={{ background: C.paper, borderRadius: 16, padding: "16px 18px", marginBottom: 12, border: o.rec ? `2px solid ${C.mint}` : `1px solid ${C.line}`, position: "relative" }}>
          {o.rec && <span style={{ position: "absolute", top: -10, right: 16, background: C.mint, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 10 }}>추천</span>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>{o.title}</div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 1.4 }}>{o.desc}</div>
            </div>
            <div style={{ textAlign: "right", marginLeft: 10 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: o.col, fontVariantNumeric: "tabular-nums" }}>{o.val}</div>
              <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>{o.badge}</div>
            </div>
          </div>
        </div>
      ))}
      <div style={{ fontSize: 11, color: "#92A09C", textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>
        적립금을 국민연금공단으로 이체하면 가입기간으로 합산되어<br />10년 요건 충족 시 노령연금 수급권이 부여됩니다.
      </div>
    </div>
  );
}

function TabBar({ tab, setTab, t }) {
  const tabs = [["home", "◉", t.home], ["history", "≡", t.history], ["refund", "↓", t.refund], ["bridge", "⇄", t.bridge]];
  return (
    <div style={{ display: "flex", background: C.paper, borderTop: `1px solid ${C.line}`, padding: "8px 6px 14px" }}>
      {tabs.map(([k, ic, lab]) => (
        <button key={k} onClick={() => setTab(k)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 0", color: tab === k ? C.petrol : "#A6B2AF" }}>
          <span style={{ fontSize: 18, fontWeight: tab === k ? 700 : 400 }}>{ic}</span>
          <span style={{ fontSize: 10.5, fontWeight: tab === k ? 700 : 500 }}>{lab}</span>
        </button>
      ))}
    </div>
  );
}

export default function MutualAidApp() {
  const [lang, setLang] = useState("ko");
  const [tab, setTab] = useState("home");
  const t = L[lang];
  const screens = { home: <Home t={t} />, history: <History t={t} />, refund: <Refund t={t} />, bridge: <Bridge t={t} /> };

  return (
    <div style={{ background: "#DCE3E1", padding: "34px 20px", fontFamily: "'Inter','Pretendard',-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif", display: "flex", gap: 36, justifyContent: "center", flexWrap: "wrap", alignItems: "flex-start" }}>
      {/* 인터랙티브 폰 */}
      <div>
        <Phone lang={lang} setLang={setLang} t={t}>
          {screens[tab]}
        </Phone>
        <div style={{ width: 380 }}>
          <div style={{ marginTop: -86, position: "relative", zIndex: 5 }}>
            <div style={{ borderRadius: "0 0 40px 40px", overflow: "hidden" }}>
              <TabBar tab={tab} setTab={setTab} t={t} />
            </div>
          </div>
        </div>
      </div>

      {/* 설명 패널 */}
      <div style={{ maxWidth: 320, paddingTop: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.14em", color: C.petrol, fontWeight: 700, marginBottom: 10 }}>
          근로자 앱 · i-Akaun형
        </div>
        <h2 style={{ fontSize: 23, fontWeight: 800, margin: "0 0 14px", letterSpacing: "-0.02em", color: C.ink }}>
          적립금을 손안에서<br />투명하게
        </h2>
        <p style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.6, margin: "0 0 22px" }}>
          상단 언어 토글과 하단 탭으로 직접 눌러보세요. 논문이 제시한 4대 접근성 원칙을 그대로 구현했어요.
        </p>
        {[
          ["실시간 적립금 조회", "원금·운용수익을 분리해 한눈에. 매 분기 수익 반영."],
          ["다국어 지원", "한국어·English·Tiếng Việt·नेपाली 즉시 전환."],
          ["100% 환급 보장", "출국 신고 → 3일 내 입금. 미청구 사각지대 제거."],
          ["Portability Bridge", "E-7-4 전환 시 국민연금 이체·가입기간 합산."],
        ].map(([h, b], i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: i === 3 ? C.gold : C.petrol, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{h}</div>
              <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.45, marginTop: 2 }}>{b}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
