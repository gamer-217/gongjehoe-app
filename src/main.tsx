import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import './ui';
import { i18nReady } from './i18n';
import { RepoProvider } from './data/context';
import { MockRepository } from './data/mock';
// 근로자 앱은 첫 화면이라 바로 넣는다(왕복 한 번 줄임)
import { WorkerApp } from './apps/worker/WorkerApp';
import { AppStart } from './apps/worker/Start';

// 화면 묶음별로 나눠 받는다(NFR-03). 시연 데이터와 지금 열 화면 묶음은 언어 준비와 동시에 받기 시작
const repo = new MockRepository();
const Launcher = lazy(() => import('./demo/Launcher').then((m) => ({ default: m.Launcher })));
const Preview = lazy(() => import('./demo/Preview').then((m) => ({ default: m.Preview })));
const StudyEnd = lazy(() => import('./demo/StudyEnd').then((m) => ({ default: m.StudyEnd })));
const EmployerApp = lazy(() => import('./apps/employer/EmployerApp').then((m) => ({ default: m.EmployerApp })));
const AdminApp = lazy(() => import('./apps/admin/AdminApp').then((m) => ({ default: m.AdminApp })));

void i18nReady.finally(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RepoProvider repo={repo}>
        <HashRouter>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<AppStart />} />
              <Route path="/demo" element={<Launcher />} />
              <Route path="/w/:memberId/*" element={<WorkerApp />} />
              <Route path="/e/*" element={<EmployerApp />} />
              <Route path="/a/*" element={<AdminApp />} />
              <Route path="/ui" element={<Preview />} />
              <Route path="/study" element={<StudyEnd />} />
            </Routes>
          </Suspense>
        </HashRouter>
      </RepoProvider>
    </StrictMode>,
  ),
);

void import('./fonts');

// 새 버전이 배포돼 서비스 워커가 바뀌면 한 번 새로고침한다(옛 화면이 남아 '링크가 다르게 열리는' 문제)
// 미리보기 창(샌드박스)에서는 serviceWorker를 읽기만 해도 오류가 나서 감싼다
try {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      location.reload();
    });
  }
} catch {
  // 서비스 워커를 쓸 수 없는 환경
}
