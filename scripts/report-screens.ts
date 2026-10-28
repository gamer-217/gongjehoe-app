// tests/a11y 결과(reports/.raw) → reports/a11y.json, reports/screens.json
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

type Raw = { lang: string; name: string; overflow: boolean; hangul: number; violations: { id: string; impact: string; help: string; nodes: string[] }[] };
const raws: Raw[] = readdirSync('reports/.raw').filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(`reports/.raw/${f}`, 'utf8')));
const byLang: Record<string, Record<string, number>> = {};
const screens: Record<string, Record<string, { overflow: boolean; hangul: number }>> = {};
for (const r of raws) {
  (byLang[r.lang] ??= {})[r.name] = r.violations.length;
  (screens[r.lang] ??= {})[r.name] = { overflow: r.overflow, hangul: r.hangul };
}
const details = raws.flatMap((r) => r.violations.map((v) => ({ lang: r.lang, screen: r.name, ...v })));
writeFileSync('reports/a11y.json', JSON.stringify({ standard: 'WCAG 2.2 AA (axe-core 태그 wcag2a·2aa·21a·21aa·22aa)', screensChecked: raws.length, totalViolations: details.length, byLang, details }, null, 2) + '\n');
writeFileSync(
  'reports/screens.json',
  JSON.stringify({ viewport: { mobile: 390, desktop: 1280 }, screensChecked: raws.length, overflowScreens: raws.filter((r) => r.overflow).length, hangulCharsInNonKo: raws.reduce((s, r) => s + r.hangul, 0), byLang: screens }, null, 2) + '\n',
);
console.log(`screens ${raws.length} · axe ${details.length} · overflow ${raws.filter((r) => r.overflow).length} · hangul ${raws.reduce((s, r) => s + r.hangul, 0)}`);
for (const d of details) console.log(`${d.lang}:${d.screen} ${d.id} ${d.nodes.join(' , ')}`);
