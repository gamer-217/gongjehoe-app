import { PARAMS, WORKERS, account } from "./data.js";
import { STR } from "./i18n.js";
const won = n => "₩" + Math.round(n).toLocaleString("ko-KR");
const $ = s => document.querySelector(s);
let state = { role: "worker", workerId: "W001", lang: "ne" };

function workerView() {
  const w = WORKERS.find(x => x.id === state.workerId), t = STR[state.lang], a = account(w);
  return `
  <div class="card"><span class="tag">${w.visa} · ${w.country}</span>
    <h2 style="margin:8px 0 2px">${w.name}</h2>
    <div class="mut">${w.months} ${t.months}</div></div>
  <div class="card"><div class="mut">${t.total}</div><div class="big">${won(a.total)}</div></div>
  <div class="row">
    <div class="card"><div class="mut">${t.mine} (4%)</div><b>${won(a.worker)}</b></div>
    <div class="card"><div class="mut">${t.boss}</div><b>${won(a.employer)}</b></div>
    <div class="card"><div class="mut">${t.gain}</div><b>${won(a.gain)}</b></div>
  </div>
  <div class="card"><div class="mut">${t.simulate}</div><div class="big">${won(a.total)}</div>
    <button class="btn">${t.apply} →</button>
    <div class="mut" style="margin-top:8px">100% refund · 3 days after departure report</div></div>`;
}
const stub = n => `<div class="card todo"><b>${n}</b><div class="mut">D${n.includes("사업주")?4:5} 구현 예정</div></div>`;
function render() {
  $("#view").innerHTML = state.role === "worker" ? workerView()
    : state.role === "employer" ? stub("사업주 포털 — 기여 현황·절감 계산") : stub("관리자 대시보드 — 기금·몬테카를로");
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("on", b.dataset.r === state.role));
}
document.addEventListener("click", e => { if (e.target.dataset.r) { state.role = e.target.dataset.r; render(); } });
$("#lang").addEventListener("change", e => { state.lang = e.target.value; render(); });
$("#who").addEventListener("change", e => { state.workerId = e.target.value; state.lang = WORKERS.find(w=>w.id===e.target.value).lang; $("#lang").value = state.lang; render(); });
$("#who").innerHTML = WORKERS.map(w => `<option value="${w.id}">${w.name}</option>`).join("");
render();
