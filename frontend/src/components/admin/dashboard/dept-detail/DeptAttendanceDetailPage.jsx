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
import ApprovePayrollFillModal from './ApprovePayrollFillModal';
import ClearAttendanceModal from './ClearAttendanceModal';
import ScanLogModal from '../../../attendance/ScanLogModal';
import ManualScheduleModal from '../../../attendance/ManualScheduleModal';
import ManualStatusRangeModal from '../../../attendance/ManualStatusRangeModal';
import NghiTrucAssignModal from '../../../attendance/NghiTrucAssignModal';
import UnlockModal from '../../../UnlockModal';
import { ADMIN_UI } from '../../../../constants/admin';
import { UI, isPostScanOverrideAction, needsNghiTrucWizard } from '../../../../constants/attendance';
import { useDeptAttendanceDetail } from '../../../../hooks/useDeptAttendanceDetail';
import { useAdminUnlockRequestCount } from '../../../../context/AdminUnlockRequestCountContext';
import { useAttendanceStatusConfig } from '../../../../context/AttendanceStatusContext';
import { useFlashMessage } from '../../../../hooks/useFlashMessage';
import { formatDeptCode, todayISO } from '../../../../utils/formatters';

const KPI_SKELETON = (
  <div
    className="min-h-[8.5rem] lg:min-h-[8rem] rounded-xl border border-line bg-surface-white animate-pulse"
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
    selectedDept,
    appliedDate,
    exporting,
    handleExport,
    fillAttendanceTimes,
    clearAttendanceDay,
    saveManualRange,
    assignNghiTrucWizard,
    saveVeSomNote,
    approvePayrollFill,
    summary,
    appliedDeptCode,
    unlockDepartment,
    relockDepartment,
    approveUnlockRequest,
  } = useDeptAttendanceDetail();

  const { statusBadge } = useAttendanceStatusConfig();
  const { flash, showSuccess, showError, clearFlash } = useFlashMessage();
  const { refreshPendingCount } = useAdminUnlockRequestCount();

  const reportSubmitted = Boolean(summary?.reportSubmitted);

  const [scanLogStaff, setScanLogStaff] = useState(null);
  const [manualScheduleStaff, setManualScheduleStaff] = useState(null);
  const [fillTimesStaff, setFillTimesStaff] = useState(null);
  const [approvePayrollStaff, setApprovePayrollStaff] = useState(null);
  const [clearStaff, setClearStaff] = useState(null);
  const [clearSaving, setClearSaving] = useState(false);
  const [manualRangeTarget, setManualRangeTarget] = useState(null);
  const [manualRangeSaving, setManualRangeSaving] = useState(false);
  const [nghiTrucTarget, setNghiTrucTarget] = useState(null);
  const [unlockOpen, setUnlockOpen] = useState(false);

  const canUnlockDate = Boolean(appliedDeptCode) && appliedDate <= todayISO();
  const canUnlock = canUnlockDate && !summary?.unlocked;
  const canRelock = canUnlockDate && Boolean(summary?.unlocked);
  const canApproveUnlockRequest =
    canUnlockDate && summary?.unlockRequestStatus === 'PENDING' && summary?.unlockRequestId != null;

  const mobileBreadcrumb = useMemo(
    () => [
      { label: ADMIN_UI.nav.dashboard },
      { label: ADMIN_UI.nav.dashboardDeptDetail },
    ],
    [],
  );

  const handleQuickAction = (empCode, action) => {
    const full = paginated.find((s) => s.empCode === empCode);
    if (!full) return;
    if (isPostScanOverrideAction(action) && needsNghiTrucWizard(full)) {
      setNghiTrucTarget({ staff: full });
      return;
    }
    setManualRangeTarget({
      staff: full,
      status: action.value,
      statusLabel: statusBadge[action.value]?.label || action.label || action.value,
      statusOptions: action.statusOptions || [],
    });
  };

  const handleNghiTrucWizardSaved = async (result) => {
    showSuccess(result?.message || UI.nghiTrucWizardSuccess);
    setNghiTrucTarget(null);
  };

  const handleManualRangeConfirm = async ({ status, fromDate, toDate, note }) => {
    if (!manualRangeTarget || manualRangeSaving) return;
    setManualRangeSaving(true);
    try {
      const result = await saveManualRange({
        empCode: manualRangeTarget.staff.empCode,
        status: status || manualRangeTarget.status,
        fromDate,
        toDate,
        note,
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

  const handleUnlockConfirm = async (reason) => {
    await unlockDepartment(reason);
    showSuccess(UI.unlockSuccess(formatDeptCode(appliedDeptCode), appliedDate));
    setUnlockOpen(false);
  };

  const handleRelock = async () => {
    try {
      await relockDepartment();
      showSuccess(UI.relockSuccess(formatDeptCode(appliedDeptCode), appliedDate));
    } catch (err) {
      showError(err.message);
    }
  };

  const handleApproveUnlockRequest = async () => {
    try {
      await approveUnlockRequest();
      await refreshPendingCount();
      showSuccess(ADMIN_UI.dashboard.unlockRequestsApproveSuccess);
    } catch (err) {
      showError(err.message);
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
    onUnlock: () => setUnlockOpen(true),
    onRelock: handleRelock,
    onApproveUnlockRequest: handleApproveUnlockRequest,
    canUnlock,
    canRelock,
    canApproveUnlockRequest,
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
    onApprovePayrollFill: setApprovePayrollStaff,
    onQuickAction: handleQuickAction,
    onClearAttendance: setClearStaff,
    onSaveVeSomNote: async (empCode, note) => {
      await saveVeSomNote(empCode, note);
      showSuccess('Đã lưu lý do về sớm.');
    },
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
          className="shrink-0 min-h-[8.5rem]"
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
            className="min-h-[8rem]"
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

      {approvePayrollStaff && (
        <ApprovePayrollFillModal
          staff={approvePayrollStaff}
          date={appliedDate}
          onClose={() => setApprovePayrollStaff(null)}
          onConfirm={async (body) => {
            await approvePayrollFill(body);
            showSuccess(UI.payrollFillApproveSuccess);
          }}
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
          statusOptions={manualRangeTarget.statusOptions}
          defaultDate={appliedDate}
          loading={manualRangeSaving}
          onConfirm={handleManualRangeConfirm}
          onClose={() => !manualRangeSaving && setManualRangeTarget(null)}
        />
      )}

      {nghiTrucTarget && (
        <NghiTrucAssignModal
          staff={nghiTrucTarget.staff}
          defaultDate={appliedDate}
          onAssign={assignNghiTrucWizard}
          onClose={() => setNghiTrucTarget(null)}
          onSaved={handleNghiTrucWizardSaved}
        />
      )}

      {unlockOpen && appliedDeptCode != null && (
        <UnlockModal
          deptCode={appliedDeptCode}
          deptName={selectedDept?.deptName || ''}
          date={appliedDate}
          onConfirm={handleUnlockConfirm}
          onClose={() => setUnlockOpen(false)}
        />
      )}
    </>
  );
}

export default function DeptAttendanceDetailPage() {
  return <DeptAttendanceDetailContent />;
}
