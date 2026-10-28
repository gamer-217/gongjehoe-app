import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import './ui';
import { i18nReady } from './i18n';
import { RepoProvider } from './data/context';
import { MockRepository } from './data/mock';
// 근로자 앱은 첫 화면이라 바로 넣는다(왕복 한 번 줄임)
import { WorkerApp } from './apps/worker/WorkerApp';

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
              <Route path="/" element={<Launcher />} />
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
