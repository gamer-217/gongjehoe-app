/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/gongjehoe-app/',
  plugins: [
    react(),
    // 글꼴이 늦게 도착해 글자를 다시 그리지 않도록 font-display: optional(다음 방문부터는 캐시된 글꼴 사용)
    {
      name: 'font-display-optional',
      enforce: 'pre',
      transform(code, id) {
        if (/(pretendard|fontsource).*\.css/.test(id)) return code.replace(/font-display:\s*swap/g, 'font-display: optional');
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: '일하는 외국인 공제회',
        short_name: '공제회',
        description: '일하는 외국인 공제회 앱 프로토타입 v2',
        start_url: '/gongjehoe-app/',
        scope: '/gongjehoe-app/',
        display: 'standalone',
        background_color: '#F4F5F6',
        theme_color: '#0B50D0',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      // NFR-04: 앱 셸은 미리 캐시, 글꼴 조각은 처음 쓸 때 캐시(한 번 연 화면은 오프라인에서도 열림)
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.woff2') || url.pathname.endsWith('.woff'),
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 200 } },
          },
        ],
      },
    }),
  ],
  test: {
    include: ['tests/rules/**/*.test.ts'],
  },
});
