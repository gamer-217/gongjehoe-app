// 근로자 앱(§8.1) — 하단 탭 4개: 홈·내역·받기·내 정보
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HandCoins, Home, List as ListIcon, User } from 'lucide-react';
import { useQuery } from '../../data/context';
import { summarize, type AccountSummary } from '../../data/selectors';
import type { MemberView } from '../../data/repository';
import { TabBar, Toast } from '../../ui';
import { Load } from '../shared/Load';
import { DemoChip } from '../../demo/DemoChip';
import { describeTarget, isStudy, logStudy } from '../shared/study';
import { HomeScreen } from './Home';
import { HistoryScreen, StatementScreen } from './History';
import { ReceiveHub, SimulatorScreen } from './Receive';
import { ApplyScreen } from './Apply';
import { StatusScreen } from './Status';
import { ConvertScreen } from './Convert';
import { MeScreen } from './Me';
import { NomineesScreen } from './Nominees';
import { AccountsScreen } from './Accounts';
import { CoverageScreen } from './Coverage';
import { LanguageScreen } from './Language';
import { HelpScreen } from './Help';

interface MemberCtx {
  view: MemberView;
  s: AccountSummary;
  base: string;
  hidden: boolean;
  setHidden: (v: boolean) => void;
  toast: (m: string) => void;
}
const Ctx = createContext<MemberCtx | null>(null);
export const useMember = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('MemberCtx missing');
  return c;
};

function StudyTracker() {
  const loc = useLocation();
  useEffect(() => {
    logStudy('view', loc.pathname.replace(/W00\d/, ':id'));
  }, [loc.pathname]);
  useEffect(() => {
    if (!isStudy()) return;
    const onClick = (e: MouseEvent) => logStudy('click', describeTarget(e.target as Element));
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
  return null;
}

function Shell(props: { children: ReactNode; memberId: string }) {
  const { t } = useTranslation();
  const q = useQuery((r) => r.getMember(props.memberId), [props.memberId]);
  const [hidden, setHidden] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const base = `/w/${props.memberId}`;
  const tabs = [
    { to: base, label: t('nav.home'), icon: <Home size={24} aria-hidden />, end: true },
    { to: `${base}/history`, label: t('nav.history'), icon: <ListIcon size={24} aria-hidden /> },
    { to: `${base}/receive`, label: t('nav.receive'), icon: <HandCoins size={24} aria-hidden /> },
    { to: `${base}/me`, label: t('nav.me'), icon: <User size={24} aria-hidden /> },
  ];
  return (
    <div className="ui-mobile">
      <StudyTracker />
      {!isStudy() && <DemoChip memberId={props.memberId} toast={setMsg} />}
      <Load q={q}>
        {(view) => (
          <Ctx.Provider value={{ view, s: summarize(view), base, hidden, setHidden, toast: setMsg }}>
            <main>{props.children}</main>
          </Ctx.Provider>
        )}
      </Load>
      <TabBar items={tabs} label={t('nav.label')} />
      <Toast message={msg} onDone={() => setMsg(null)} />
    </div>
  );
}

export function WorkerApp() {
  const { memberId = '' } = useParams();
  return (
    <Routes>
      {/* 옛 언어 선택 화면(/w/:id/start)은 새 시작 흐름(#/)과 겹쳐 없앰 — 옛 링크는 홈으로 */}
      <Route path="start" element={<Navigate to={`/w/${memberId}`} replace />} />
      <Route
        path="*"
        element={
          <Shell memberId={memberId}>
            <Routes>
              <Route index element={<HomeScreen />} />
              <Route path="history" element={<HistoryScreen />} />
              <Route path="history/statement" element={<StatementScreen />} />
              <Route path="receive" element={<ReceiveHub />} />
              <Route path="receive/simulate" element={<SimulatorScreen />} />
              <Route path="receive/apply" element={<ApplyScreen />} />
              <Route path="receive/status" element={<StatusScreen />} />
              <Route path="receive/convert" element={<ConvertScreen />} />
              <Route path="me" element={<MeScreen />} />
              <Route path="me/nominees" element={<NomineesScreen />} />
              <Route path="me/accounts" element={<AccountsScreen />} />
              <Route path="me/coverage" element={<CoverageScreen />} />
              <Route path="me/language" element={<LanguageScreen />} />
              <Route path="me/help" element={<HelpScreen />} />
              <Route path="*" element={<Navigate to={`/w/${memberId}`} replace />} />
            </Routes>
          </Shell>
        }
      />
    </Routes>
  );
}
