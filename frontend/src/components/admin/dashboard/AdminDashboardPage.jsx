import { useEffect } from 'react';
import FlashBanner from '../../shared/FlashBanner';
import AdminSubmenuBreadcrumb from '../sections/AdminSubmenuBreadcrumb';
import { ADMIN_UI, DESKTOP_DEPT_PROGRESS_PAGE_SIZE, MOBILE_DEPT_PROGRESS_PAGE_SIZE } from '../../../constants/admin';
import { useAdminDashboardContext } from '../../../context/AdminDashboardContext';
import { usePagination } from '../../../hooks/usePagination';
import DashboardKpiBar from './DashboardKpiBar';
import DeptProgressTable from './DeptProgressTable';
import DeptProgressMobileSection from './DeptProgressMobileSection';
import PresenceDonutChart from './PresenceDonutChart';
import ReminderModal from './ReminderModal';

export default function AdminDashboardPage() {
  const ctx = useAdminDashboardContext();
  const {
    loading,
    displayKpi,
    kpiScopeLabel,
    filteredDepts,
    incompleteDepts,
    remindableDepts,
    deptFilter,
    reminderOpen,
    setReminderOpen,
    selectedDeptCodes,
    toggleReminderDept,
    toggleReminderAll,
    sendReminders,
    reminderSending,
    toggleDeptLock,
    toggleReportBlock,
    isActionPending,
    flash,
    clearFlash,
  } = ctx ?? {};

  const {
    page: deptPage,
    totalPages: deptTotalPages,
    paginated: paginatedDepts,
    goToPage: goToDeptPage,
  } = usePagination(filteredDepts ?? [], MOBILE_DEPT_PROGRESS_PAGE_SIZE);

  const {
    page: desktopDeptPage,
    totalPages: desktopDeptTotalPages,
    paginated: desktopPaginatedDepts,
    pageSize: desktopDeptPageSize,
    goToPage: goToDesktopDeptPage,
  } = usePagination(filteredDepts ?? [], DESKTOP_DEPT_PROGRESS_PAGE_SIZE);

  useEffect(() => {
    goToDeptPage(1);
    goToDesktopDeptPage(1);
  }, [deptFilter, goToDeptPage, goToDesktopDeptPage]);

  const { dashboard: d } = ADMIN_UI;

  if (!ctx || (loading && !displayKpi)) {
    return (
      <div className="py-24 text-center text-content-muted animate-pulse">{d.loading}</div>
    );
  }

  return (
    <>
      <AdminSubmenuBreadcrumb parentLabelKey="dashboard" currentLabelKey="dashboardOverview" />

      <div className="flex flex-col lg:h-full lg:min-h-0 gap-2 lg:gap-2">
        {flash && <FlashBanner flash={flash} onClose={clearFlash} />}

        <div className="shrink-0">
          <DashboardKpiBar kpi={displayKpi} scopeLabel={kpiScopeLabel} />
        </div>

        <div className="lg:hidden flex flex-col gap-2">
          <PresenceDonutChart kpi={displayKpi} scopeLabel={kpiScopeLabel} compact />

          <DeptProgressMobileSection
            departments={paginatedDepts}
            page={deptPage}
            totalPages={deptTotalPages}
            totalItems={filteredDepts.length}
            onPageChange={goToDeptPage}
            onToggleLock={toggleDeptLock}
            onToggleReportBlock={toggleReportBlock}
            isActionPending={isActionPending}
          />
        </div>

        <div className="hidden lg:grid grid-cols-1 xl:grid-cols-3 gap-4 flex-1 min-h-0 h-full items-stretch">
          <div className="xl:col-span-2 min-h-0 flex flex-col">
            <DeptProgressTable
              departments={desktopPaginatedDepts}
              onToggleLock={toggleDeptLock}
              onToggleReportBlock={toggleReportBlock}
              isActionPending={isActionPending}
              page={desktopDeptPage}
              totalPages={desktopDeptTotalPages}
              totalItems={filteredDepts.length}
              pageSize={desktopDeptPageSize}
              onPageChange={goToDesktopDeptPage}
            />
          </div>
          <div className="min-h-0 flex flex-col">
            <PresenceDonutChart kpi={displayKpi} scopeLabel={kpiScopeLabel} />
          </div>
        </div>
      </div>

      <ReminderModal
        open={reminderOpen}
        incompleteDepts={incompleteDepts}
        remindableDepts={remindableDepts}
        selectedDeptCodes={selectedDeptCodes}
        onToggleDept={toggleReminderDept}
        onToggleAll={toggleReminderAll}
        onClose={() => setReminderOpen(false)}
        onSend={sendReminders}
        sending={reminderSending}
      />
    </>
  );
}
