import { useState, lazy, Suspense, useEffect, useMemo } from 'react';
import AdminShell from './layout/AdminShell';
import RouteErrorBoundary from '../shared/RouteErrorBoundary';
import { ADMIN_DEFAULT_TAB, ADMIN_TAB_IDS, ADMIN_UI } from '../../constants/admin';
import {
  ADMIN_CACHEABLE_TAB_IDS,
} from '../../constants/adminTabs';
import { AdminDashboardProvider } from '../../context/AdminDashboardContext';
import { AiAssistantProvider } from '../../context/AiAssistantContext';
import { AttendanceStatusProvider } from '../../context/AttendanceStatusContext';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { useAdminTabRouting } from '../../hooks/useAdminTabRouting';

const DepartmentsPage = lazy(() => import('../departments/DepartmentsPage'));
const StaffPage = lazy(() => import('../staff/StaffPage'));
const StaffRankCatalogPage = lazy(() => import('../staff-catalog/StaffRankCatalogPage'));
const StaffPositionCatalogPage = lazy(() => import('../staff-catalog/StaffPositionCatalogPage'));
const StatusCatalogPage = lazy(() => import('../status-catalog/StatusCatalogPage'));
const AdminDashboardPage = lazy(() => import('./dashboard/AdminDashboardPage'));
const DeptAttendanceDetailPage = lazy(() => import('./dashboard/dept-detail/DeptAttendanceDetailPage'));
const SystemSettingsPage = lazy(() => import('../settings/SystemSettingsPage'));
const UserPermissionsPage = lazy(() => import('../settings/UserPermissionsPage'));
const FingerprintKioskTokensPage = lazy(() => import('../settings/FingerprintKioskTokensPage'));
const ReminderHistoryPage = lazy(() => import('./utilities/ReminderHistoryPage'));
const ChangePasswordForm = lazy(() => import('../account/ChangePasswordForm'));
const ClinicalFlowPanel = lazy(() => import('../ai/ClinicalFlowPanel'));

const TAB_COMPONENTS = {
  [ADMIN_TAB_IDS.DEPARTMENTS]: DepartmentsPage,
  [ADMIN_TAB_IDS.STAFF]: StaffPage,
  [ADMIN_TAB_IDS.STAFF_RANKS]: StaffRankCatalogPage,
  [ADMIN_TAB_IDS.STAFF_POSITIONS]: StaffPositionCatalogPage,
  [ADMIN_TAB_IDS.STATUS_CATALOG]: StatusCatalogPage,
  [ADMIN_TAB_IDS.DASHBOARD_OVERVIEW]: AdminDashboardPage,
  [ADMIN_TAB_IDS.DASHBOARD_DEPT_DETAIL]: DeptAttendanceDetailPage,
  [ADMIN_TAB_IDS.SETTINGS_SYSTEM]: SystemSettingsPage,
  [ADMIN_TAB_IDS.SETTINGS_USERS]: UserPermissionsPage,
  [ADMIN_TAB_IDS.SETTINGS_FINGERPRINT_TOKENS]: FingerprintKioskTokensPage,
  [ADMIN_TAB_IDS.UTILITIES_REMINDER_HISTORY]: ReminderHistoryPage,
};

function AdminContent({ activeTab }) {
  if (activeTab === ADMIN_TAB_IDS.PASSWORD) {
    return (
      <div className="max-w-md mx-auto">
        <ChangePasswordForm idPrefix="admin-" />
      </div>
    );
  }
  const Component = TAB_COMPONENTS[activeTab] ?? AdminDashboardPage;
  return <Component />;
}

function CachedTabPanel({ tabId, activeTab, children }) {
  if (tabId !== activeTab) {
    return <div className="hidden" aria-hidden="true">{children}</div>;
  }
  return children;
}

const TAB_LOADING_FALLBACK = (
  <div className="py-24 text-center text-content-muted animate-pulse">{ADMIN_UI.loading}</div>
);

export default function AdminApp({ user, onLogout }) {
  const { activeTab, changeTab } = useAdminTabRouting();
  const [mountedTabs, setMountedTabs] = useState(() => new Set([ADMIN_DEFAULT_TAB]));
  const isDashboard = activeTab === ADMIN_TAB_IDS.DASHBOARD_OVERVIEW;
  const dashboardState = useAdminDashboard({ enabled: isDashboard });

  useEffect(() => {
    if (!ADMIN_CACHEABLE_TAB_IDS.has(activeTab)) return;
    setMountedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  const cachedTabEntries = useMemo(
    () => [...mountedTabs].filter((tabId) => ADMIN_CACHEABLE_TAB_IDS.has(tabId)),
    [mountedTabs],
  );

  const showEphemeralTab =
    activeTab !== ADMIN_TAB_IDS.PASSWORD && !ADMIN_CACHEABLE_TAB_IDS.has(activeTab);

  return (
    <AttendanceStatusProvider>
    <AdminDashboardProvider value={isDashboard ? dashboardState : null}>
      <AiAssistantProvider>
        <AdminShell
          activeTab={activeTab}
          onTabChange={changeTab}
          user={user}
          onLogout={onLogout}
        >
          <Suspense fallback={TAB_LOADING_FALLBACK}>
            {cachedTabEntries.map((tabId) => (
              <RouteErrorBoundary key={tabId} title="Không tải được trang quản trị">
                <CachedTabPanel tabId={tabId} activeTab={activeTab}>
                  <AdminContent activeTab={tabId} />
                </CachedTabPanel>
              </RouteErrorBoundary>
            ))}

            {showEphemeralTab && (
              <RouteErrorBoundary key={activeTab} title="Không tải được trang quản trị">
                <AdminContent activeTab={activeTab} />
              </RouteErrorBoundary>
            )}

            {activeTab === ADMIN_TAB_IDS.PASSWORD && (
              <RouteErrorBoundary key={ADMIN_TAB_IDS.PASSWORD} title="Không tải được trang quản trị">
                <AdminContent activeTab={ADMIN_TAB_IDS.PASSWORD} />
              </RouteErrorBoundary>
            )}
          </Suspense>
        </AdminShell>

        <Suspense fallback={null}>
          <ClinicalFlowPanel />
        </Suspense>
      </AiAssistantProvider>
    </AdminDashboardProvider>
    </AttendanceStatusProvider>
  );
}
