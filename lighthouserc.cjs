// Lighthouse(@lhci/cli) — 모바일 기본 에뮬레이션(§7.1, NFR-03). 결과는 reports/lighthouse/
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npx vite preview --port 4174 --strictPort',
      startServerReadyPattern: 'Local',
      url: ['http://localhost:4174/gongjehoe-app/#/w/W001', 'http://localhost:4174/gongjehoe-app/#/w/W001/receive/apply'],
      numberOfRuns: 3,
      chromePath: process.env.CHROME_PATH,
      settings: { chromeFlags: '--headless=new --no-sandbox' },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9, aggregationMethod: 'median' }],
        'categories:accessibility': ['error', { minScore: 0.9, aggregationMethod: 'median' }],
      },
    },
    upload: { target: 'filesystem', outputDir: 'reports/lighthouse' },
  },
};
