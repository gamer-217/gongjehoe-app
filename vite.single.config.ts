// 파일 하나로 여는 판(공제회앱.html) — 더블클릭으로 열거나 Claude 아티팩트로 올린다.
// 글꼴·번역·코드를 모두 HTML 안에 넣고, file://에서는 동작하지 않는 PWA(서비스 워커)는 뺀다.
// 글꼴 설정은 vite.config.ts와 같은 패키지 CSS를 그대로 쓴다(바꾸지 않음).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync, renameSync } from 'node:fs';

// index.html의 아이콘 주소(/gongjehoe-app/icon-192.png)를 그림 데이터로 바꿔 파일 하나로 열리게 한다
const icon = `data:image/png;base64,${readFileSync('public/icon-192.png').toString('base64')}`;

export default defineConfig({
  base: './',
  plugins: [
    react(),
    { name: 'inline-icon', transformIndexHtml: (html) => html.replaceAll('/gongjehoe-app/icon-192.png', icon) },
    viteSingleFile({ removeViteModuleLoader: true }),
    { name: 'rename', closeBundle: () => renameSync('release/index.html', 'release/gongjehoe-app.html') },
  ],
  build: {
    outDir: 'release',
    emptyOutDir: false,
    copyPublicDir: false,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
  },
});
