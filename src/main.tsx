import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import '@fontsource/noto-sans-devanagari/400.css';
import '@fontsource/noto-sans-devanagari/700.css';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './ui';
import './i18n';
import { RepoProvider } from './data/context';
import { Launcher } from './demo/Launcher';
import { Preview } from './demo/Preview';
import { StudyEnd } from './demo/StudyEnd';
import { WorkerApp } from './apps/worker/WorkerApp';
import { EmployerApp } from './apps/employer/EmployerApp';
import { AdminApp } from './apps/admin/AdminApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RepoProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Launcher />} />
          <Route path="/w/:memberId/*" element={<WorkerApp />} />
          <Route path="/e/*" element={<EmployerApp />} />
          <Route path="/a/*" element={<AdminApp />} />
          <Route path="/ui" element={<Preview />} />
          <Route path="/study" element={<StudyEnd />} />
        </Routes>
      </HashRouter>
    </RepoProvider>
  </StrictMode>,
);
