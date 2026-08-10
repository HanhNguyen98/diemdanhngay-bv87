import { useState, lazy, Suspense } from 'react';
import { HEAD_NAV_IDS, UI } from '../constants/attendance';
import { AttendanceStatusProvider } from '../context/AttendanceStatusContext';
import { HeadAiSessionProvider } from '../context/HeadAiSessionContext';
import { HeadAiAssistantProvider } from '../context/HeadAiAssistantContext';
import HeadFlowPanel from './ai/head/HeadFlowPanel';

const AttendancePage = lazy(() => import('./attendance/AttendancePage'));
const StatisticsPage = lazy(() => import('./statistics/StatisticsPage'));
const ChangePasswordPage = lazy(() => import('./account/ChangePasswordPage'));
const HeadStaffPage = lazy(() => import('./staff/HeadStaffPage'));

function HeadRouteFallback() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-surface-page text-content-muted animate-pulse text-sm">
      {UI.loading}
    </div>
  );
}

export default function Dashboard({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState(HEAD_NAV_IDS.HOME);

  const pageProps = {
    user,
    onLogout,
    activeNav,
    onNavChange: setActiveNav,
  };

  let Page = AttendancePage;
  if (activeNav === HEAD_NAV_IDS.PASSWORD) {
    Page = ChangePasswordPage;
  } else if (activeNav === HEAD_NAV_IDS.STATISTICS) {
    Page = StatisticsPage;
  } else if (activeNav === HEAD_NAV_IDS.STAFF) {
    Page = HeadStaffPage;
  }

  return (
    <AttendanceStatusProvider>
      <HeadAiSessionProvider>
        <Suspense fallback={<HeadRouteFallback />}>
          <Page {...pageProps} />
        </Suspense>
        <HeadAiAssistantProvider>
          <HeadFlowPanel />
        </HeadAiAssistantProvider>
      </HeadAiSessionProvider>
    </AttendanceStatusProvider>
  );
}
