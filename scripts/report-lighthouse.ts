// reports/lighthouse/*.report.json → reports/lighthouse/summary.json(URL별 중앙값)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const dir = 'reports/lighthouse';
const runs = readdirSync(dir)
  .filter((f) => f.endsWith('.report.json'))
  .map((f) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')));
const by: Record<string, Record<string, number[]>> = {};
for (const r of runs) {
  const u = (by[r.finalDisplayedUrl.replace(/^https?:\/\/[^/]+/, '')] ??= {});
  for (const [k, v] of Object.entries(r.categories as Record<string, { score: number }>)) (u[k] ??= []).push(Math.round(v.score * 100));
  (u.lcp_ms ??= []).push(Math.round(r.audits['largest-contentful-paint'].numericValue));
  (u.fcp_ms ??= []).push(Math.round(r.audits['first-contentful-paint'].numericValue));
}
const median = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const summary = {
  tool: '@lhci/cli, Lighthouse 모바일 기본 에뮬레이션(느린 4G·CPU 4배 감속)',
  runsPerUrl: Math.max(...Object.values(by).map((u) => u.performance.length)),
  urls: Object.fromEntries(Object.entries(by).map(([u, m]) => [u, Object.fromEntries(Object.entries(m).map(([k, v]) => [k, median(v)]))])),
};
writeFileSync(`${dir}/summary.json`, JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary.urls));
