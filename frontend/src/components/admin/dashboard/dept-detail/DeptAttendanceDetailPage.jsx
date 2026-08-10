import { useMemo, useState } from 'react';
import InlineErrorBanner from '../../../shared/InlineErrorBanner';
import FlashBanner from '../../../shared/FlashBanner';
import StableDataZone from '../../../shared/StableDataZone';
import AdminBreadcrumb from '../../sections/AdminBreadcrumb';
import DashboardKpiBar from '../DashboardKpiBar';
import DeptAttendanceFilterBar from './DeptAttendanceFilterBar';
import DeptAttendanceMobileFilter from './DeptAttendanceMobileFilter';
import DeptAttendanceMobileSection from './DeptAttendanceMobileSection';
import DeptAttendanceTable from './DeptAttendanceTable';
import FillAttendanceTimesModal from './FillAttendanceTimesModal';
import ClearAttendanceModal from './ClearAttendanceModal';
import ScanLogModal from '../../../attendance/ScanLogModal';
import ManualScheduleModal from '../../../attendance/ManualScheduleModal';
import ManualStatusRangeModal from '../../../attendance/ManualStatusRangeModal';
import { ADMIN_UI } from '../../../../constants/admin';
import { useDeptAttendanceDetail } from '../../../../hooks/useDeptAttendanceDetail';
import { useAttendanceStatusConfig } from '../../../../context/AttendanceStatusContext';
import { useFlashMessage } from '../../../../hooks/useFlashMessage';

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
    appliedDate,
    exporting,
    handleExport,
    fillAttendanceTimes,
    clearAttendanceDay,
    saveManualRange,
    summary,
  } = useDeptAttendanceDetail();

  const { statusBadge } = useAttendanceStatusConfig();
  const { flash, showSuccess, showError, clearFlash } = useFlashMessage();

  const reportSubmitted = Boolean(summary?.reportSubmitted);

  const [scanLogStaff, setScanLogStaff] = useState(null);
  const [manualScheduleStaff, setManualScheduleStaff] = useState(null);
  const [fillTimesStaff, setFillTimesStaff] = useState(null);
  const [clearStaff, setClearStaff] = useState(null);
  const [clearSaving, setClearSaving] = useState(false);
  const [manualRangeTarget, setManualRangeTarget] = useState(null);
  const [manualRangeSaving, setManualRangeSaving] = useState(false);

  const mobileBreadcrumb = useMemo(
    () => [
      { label: ADMIN_UI.nav.dashboard },
      { label: ADMIN_UI.nav.dashboardDeptDetail },
    ],
    [],
  );

  const handleQuickAction = (empCode, status) => {
    const full = paginated.find((s) => s.empCode === empCode);
    if (!full) return;
    setManualRangeTarget({
      staff: full,
      status,
      statusLabel: statusBadge[status]?.label || status,
    });
  };

  const handleManualRangeConfirm = async ({ fromDate, toDate }) => {
    if (!manualRangeTarget || manualRangeSaving) return;
    setManualRangeSaving(true);
    try {
      const result = await saveManualRange({
        empCode: manualRangeTarget.staff.empCode,
        status: manualRangeTarget.status,
        fromDate,
        toDate,
      });
      showSuccess(result.message || 'Đã cập nhật Chấm công.');
      setManualRangeTarget(null);
    } catch (err) {
      showError(err.message);
    } finally {
      setManualRangeSaving(false);
    }
  };

  const handleClearConfirm = async (body) => {
    setClearSaving(true);
    try {
      await clearAttendanceDay(body);
      showSuccess(ADMIN_UI.dashboard.clearAttendanceSuccess);
      setClearStaff(null);
    } finally {
      setClearSaving(false);
    }
  };

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
    onOpenScanLogs: setScanLogStaff,
    onOpenManualSchedule: setManualScheduleStaff,
    onFillTimes: setFillTimesStaff,
    onQuickAction: handleQuickAction,
    onClearAttendance: setClearStaff,
  };

  const kpiBar = (
    <DashboardKpiBar kpi={displayKpi} scopeLabel={displayScopeLabel} />
  );

  return (
    <>
      {flash && <FlashBanner flash={flash} onClose={clearFlash} />}
      <InlineErrorBanner message={error} className="shrink-0" />

      <div className="lg:hidden space-y-4 min-w-0 max-w-full">
        <div className="shrink-0 border-b border-line py-2.5 -mt-3 -mx-[clamp(0.75rem,3vw,1.25rem)] px-[clamp(0.75rem,3vw,1.25rem)] min-w-0">
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

      {scanLogStaff && (
        <ScanLogModal
          staff={scanLogStaff}
          date={appliedDate}
          onClose={() => setScanLogStaff(null)}
        />
      )}

      {manualScheduleStaff && (
        <ManualScheduleModal
          staff={manualScheduleStaff}
          onClose={() => setManualScheduleStaff(null)}
        />
      )}

      {fillTimesStaff && (
        <FillAttendanceTimesModal
          staff={fillTimesStaff}
          date={appliedDate}
          onClose={() => setFillTimesStaff(null)}
          onSaved={fillAttendanceTimes}
        />
      )}

      {clearStaff && (
        <ClearAttendanceModal
          staff={clearStaff}
          date={appliedDate}
          reportSubmitted={reportSubmitted}
          loading={clearSaving}
          onClose={() => !clearSaving && setClearStaff(null)}
          onConfirm={handleClearConfirm}
        />
      )}

      {manualRangeTarget && (
        <ManualStatusRangeModal
          staff={manualRangeTarget.staff}
          status={manualRangeTarget.status}
          statusLabel={manualRangeTarget.statusLabel}
          defaultDate={appliedDate}
          loading={manualRangeSaving}
          onConfirm={handleManualRangeConfirm}
          onClose={() => !manualRangeSaving && setManualRangeTarget(null)}
        />
      )}
    </>
  );
}

export default function DeptAttendanceDetailPage() {
  return <DeptAttendanceDetailContent />;
}
