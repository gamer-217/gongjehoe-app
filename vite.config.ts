/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/gongjehoe-app/',
  plugins: [
    react(),
    // 글꼴은 font-display: swap(패키지 기본값). optional이면 첫 방문 때 글꼴이 늦으면 시스템 기본 글꼴로 남아 화면이 투박해 보였다(2026-10-30 수정)
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
        background_color: '#F5F4FB',
        theme_color: '#281C9D',
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
