// 규칙 엔진 테스트 결과 → reports/rules.json (§6.4, §11.3)
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const tmp = 'reports/.vitest-rules.json';
mkdirSync('reports', { recursive: true });
try {
  execSync(`npx vitest run tests/rules --reporter=json --outputFile=${tmp}`, { stdio: 'inherit' });
} catch {
  // 실패해도 결과는 기록한다(실패 수가 0이 아니게 남는다)
}
const raw = JSON.parse(readFileSync(tmp, 'utf8'));
rmSync(tmp);

const byRule: Record<string, { cases: number; passed: number; failed: number }> = {};
for (const file of raw.testResults) {
  for (const t of file.assertionResults) {
    const title: string = [...t.ancestorTitles, t.title].join(' ');
    const ids = title.match(/BR-\d+|NFR-\d+|§\d+(\.\d+)?/g) ?? ['기타'];
    for (const id of new Set(ids)) {
      byRule[id] ??= { cases: 0, passed: 0, failed: 0 };
      byRule[id].cases += 1;
      if (t.status === 'passed') byRule[id].passed += 1;
      else byRule[id].failed += 1;
    }
  }
}
const sorted = Object.fromEntries(Object.entries(byRule).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })));
const report = {
  total: raw.numTotalTests,
  passed: raw.numPassedTests,
  failed: raw.numFailedTests,
  rules: sorted,
};
writeFileSync('reports/rules.json', JSON.stringify(report, null, 2) + '\n');
console.log(`rules.json: ${report.passed}/${report.total} passed, ${Object.keys(sorted).length} rule groups`);
if (report.failed > 0) process.exit(1);
