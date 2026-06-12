import { useState, lazy, Suspense } from 'react';
import AdminShell from './layout/AdminShell';
import { ADMIN_DEFAULT_TAB, ADMIN_TAB_IDS, ADMIN_UI } from '../../constants/admin';
import { AdminDashboardProvider } from '../../context/AdminDashboardContext';
import { AiAssistantProvider } from '../../context/AiAssistantContext';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import ClinicalFlowPanel from '../ai/ClinicalFlowPanel';

const DepartmentsPage = lazy(() => import('../departments/DepartmentsPage'));
const StaffPage = lazy(() => import('../staff/StaffPage'));
const AdminDashboardPage = lazy(() => import('./dashboard/AdminDashboardPage'));
const DeptAttendanceDetailPage = lazy(() => import('./dashboard/dept-detail/DeptAttendanceDetailPage'));
const SystemSettingsPage = lazy(() => import('../settings/SystemSettingsPage'));
const UserPermissionsPage = lazy(() => import('../settings/UserPermissionsPage'));
const ReminderHistoryPage = lazy(() => import('./utilities/ReminderHistoryPage'));
const ChangePasswordForm = lazy(() => import('../account/ChangePasswordForm'));

const TAB_COMPONENTS = {
  [ADMIN_TAB_IDS.DEPARTMENTS]: DepartmentsPage,
  [ADMIN_TAB_IDS.STAFF]: StaffPage,
  [ADMIN_TAB_IDS.DASHBOARD_OVERVIEW]: AdminDashboardPage,
  [ADMIN_TAB_IDS.DASHBOARD_DEPT_DETAIL]: DeptAttendanceDetailPage,
  [ADMIN_TAB_IDS.SETTINGS_SYSTEM]: SystemSettingsPage,
  [ADMIN_TAB_IDS.SETTINGS_USERS]: UserPermissionsPage,
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

export default function AdminApp({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState(ADMIN_DEFAULT_TAB);
  const isDashboard = activeTab === ADMIN_TAB_IDS.DASHBOARD_OVERVIEW;
  const dashboardState = useAdminDashboard({ enabled: isDashboard });

  return (
    <AdminDashboardProvider value={isDashboard ? dashboardState : null}>
      <AiAssistantProvider>
        <AdminShell
          activeTab={activeTab}
          onTabChange={setActiveTab}
          user={user}
          onLogout={onLogout}
        >
          <Suspense
            fallback={
              <div className="py-24 text-center text-content-muted animate-pulse">
                {ADMIN_UI.loading}
              </div>
            }
          >
            <AdminContent activeTab={activeTab} />
          </Suspense>
        </AdminShell>
        <ClinicalFlowPanel />
      </AiAssistantProvider>
    </AdminDashboardProvider>
  );
}
