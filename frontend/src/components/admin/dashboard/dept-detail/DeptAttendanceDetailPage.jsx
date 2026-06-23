import { useMemo } from 'react';
import InlineErrorBanner from '../../../shared/InlineErrorBanner';
import StableDataZone from '../../../shared/StableDataZone';
import AdminBreadcrumb from '../../sections/AdminBreadcrumb';
import DashboardKpiBar from '../DashboardKpiBar';
import DeptAttendanceFilterBar from './DeptAttendanceFilterBar';
import DeptAttendanceMobileFilter from './DeptAttendanceMobileFilter';
import DeptAttendanceMobileSection from './DeptAttendanceMobileSection';
import DeptAttendanceTable from './DeptAttendanceTable';
import { ADMIN_UI } from '../../../../constants/admin';
import { AttendanceStatusProvider } from '../../../../context/AttendanceStatusContext';
import { useDeptAttendanceDetail } from '../../../../hooks/useDeptAttendanceDetail';

const KPI_SKELETON = (
  <div
    className="min-h-[9.5rem] rounded-xl border border-line bg-surface-white animate-pulse"
    aria-hidden="true"
  />
);

function DeptAttendanceDetailContent() {
  const {
    departments,
    draftDeptCode,
    setDraftDeptCode,
    draftDate,
    setDraftDate,
    applyFilter,
    resetFilters,
    displayKpi,
    displayScopeLabel,
    paginated,
    initialLoading,
    refreshing,
    showKpiSpinner,
    error,
    page,
    totalPages,
    pageSize,
    goToPage,
    filteredCount,
    exporting,
    handleExport,
  } = useDeptAttendanceDetail();

  const mobileBreadcrumb = useMemo(
    () => [
      { label: ADMIN_UI.nav.dashboard },
      { label: ADMIN_UI.nav.dashboardDeptDetail },
    ],
    [],
  );

  const filterProps = {
    departments,
    deptCode: draftDeptCode,
    onDeptChange: setDraftDeptCode,
    date: draftDate,
    onDateChange: setDraftDate,
    onApply: applyFilter,
    onReset: resetFilters,
    onExport: handleExport,
    initialLoading,
    exporting,
    canExport: filteredCount > 0,
  };

  const listProps = {
    items: paginated,
    initialLoading,
    refreshing,
    page,
    totalPages,
    totalItems: filteredCount,
    pageSize,
    onPageChange: goToPage,
  };

  const kpiBar = (
    <DashboardKpiBar kpi={displayKpi} scopeLabel={displayScopeLabel} />
  );

  return (
    <>
      <InlineErrorBanner message={error} className="shrink-0" />

      <div className="lg:hidden space-y-4">
        <div className="shrink-0 border-b border-line py-2.5 -mt-3 -mx-[clamp(0.75rem,3vw,1.25rem)] px-[clamp(0.75rem,3vw,1.25rem)]">
          <AdminBreadcrumb items={mobileBreadcrumb} mobileTruncate />
        </div>

        <StableDataZone
          initialLoading={showKpiSpinner}
          skeleton={KPI_SKELETON}
          className="shrink-0 min-h-[9.5rem]"
        >
          {kpiBar}
        </StableDataZone>
        <DeptAttendanceMobileFilter {...filterProps} />
        <DeptAttendanceMobileSection {...listProps} />
      </div>

      <div className="hidden lg:flex h-full min-h-0 flex-col gap-4">
        <div className="shrink-0">
          <StableDataZone
            initialLoading={showKpiSpinner}
            skeleton={KPI_SKELETON}
            className="min-h-[9.5rem]"
          >
            {kpiBar}
          </StableDataZone>
        </div>

        <div className="shrink-0">
          <DeptAttendanceFilterBar {...filterProps} />
        </div>

        <DeptAttendanceTable {...listProps} />
      </div>
    </>
  );
}

export default function DeptAttendanceDetailPage() {
  return (
    <AttendanceStatusProvider>
      <DeptAttendanceDetailContent />
    </AttendanceStatusProvider>
  );
}
