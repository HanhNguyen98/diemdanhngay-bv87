import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ADMIN_UI } from '../constants/admin';
import { STATUS_BADGE, UI } from '../constants/attendance';
import { useResponsivePageSize } from './useResponsivePageSize';
import { useAttendanceStatusConfig } from '../context/AttendanceStatusContext';
import { api } from '../api/client';
import { adminApi } from '../services/api';
import { downloadExcel } from '../utils/exportExcel';
import { formatDeptFilterLabel, formatInstantHm, todayISO } from '../utils/formatters';
import { formatKioskMachineParts } from '../utils/kioskMachine';
import { getDeptAttendanceDetailFilterDefaults } from '../utils/filterResetDefaults';
import { buildBreakdownFromStaff } from '../utils/statusBreakdown';
import { useCommittedSnapshot } from './useCommittedSnapshot';
import { useLoadingPhase } from './useLoadingPhase';
import { usePagination } from './usePagination';

function buildKpiFromSummary(summary) {
  return {
    total: summary.total,
    statusBreakdown: summary.statusBreakdown ?? [],
    unchecked: summary.uncheckedCount ?? 0,
  };
}

function buildKpiFromStaff(staffList, statusCatalogItems) {
  if (!staffList.length || !statusCatalogItems.length) return null;
  const statusBreakdown = buildBreakdownFromStaff(staffList, statusCatalogItems);
  const marked = statusBreakdown.reduce((sum, item) => sum + (item.count ?? 0), 0);
  return {
    total: staffList.length,
    statusBreakdown,
    unchecked: Math.max(0, staffList.length - marked),
  };
}

function buildScopeLabel(deptCode, departments) {
  const { dashboard: d } = ADMIN_UI;
  if (deptCode == null) return d.kpiScopeHospital;
  const dept = departments.find((item) => item.deptCode === deptCode);
  return d.kpiScopeDept(formatDeptFilterLabel(dept));
}

export function useDeptAttendanceDetail() {
  const pageSize = useResponsivePageSize();
  const { statusOptions, items: statusCatalogItems } = useAttendanceStatusConfig();

  const statusLabel = useCallback(
    (status) => {
      if (!status) return UI.filterUnchecked;
      return statusOptions.find((o) => o.value === status)?.label
        || STATUS_BADGE[status]?.label
        || status;
    },
    [statusOptions],
  );

  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);

  const [draftDeptCode, setDraftDeptCode] = useState(null);
  const [draftDate, setDraftDate] = useState(todayISO());
  const [appliedDeptCode, setAppliedDeptCode] = useState(null);
  const [appliedDate, setAppliedDate] = useState(todayISO());

  const [summary, setSummary] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [kpiReady, setKpiReady] = useState(false);

  const hasDataLoadedRef = useRef(false);

  const {
    snapshot: displayKpi,
    commit: commitKpi,
    reset: resetKpi,
  } = useCommittedSnapshot(null);

  const {
    snapshot: displayScopeLabel,
    commit: commitScopeLabel,
    reset: resetScopeLabel,
  } = useCommittedSnapshot('');

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setDeptLoading(true);
      try {
        const depts = await adminApi.listDepartments(undefined, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setDepartments(Array.isArray(depts) ? depts : []);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message);
      } finally {
        if (!controller.signal.aborted) setDeptLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const commitDisplay = useCallback(
    (deptCode, nextSummary, nextStaff, deptList) => {
      const kpi =
        deptCode != null && nextSummary
          ? buildKpiFromSummary(nextSummary)
          : buildKpiFromStaff(nextStaff, statusCatalogItems);
      commitKpi(kpi);
      commitScopeLabel(buildScopeLabel(deptCode, deptList));
    },
    [commitKpi, commitScopeLabel, statusCatalogItems],
  );

  const loadData = useCallback(
    async (deptCode, date, deptList, signal) => {
      const silent = hasDataLoadedRef.current;
      if (!silent) {
        setLoading(true);
      }
      setError('');
      try {
        if (deptCode == null) {
          if (!deptList.length) {
            setSummary(null);
            setStaff([]);
            if (!hasDataLoadedRef.current) {
              resetKpi(null);
              resetScopeLabel('');
            }
            return;
          }
          const pages = await Promise.all(
            deptList.map((dept) => api.getAttendancePage(dept.deptCode, date, { signal })),
          );
          if (signal?.aborted) return;
          const nextStaff = pages.flatMap((page) => page.staff || []);
          setSummary(null);
          setStaff(nextStaff);
          commitDisplay(deptCode, null, nextStaff, deptList);
          hasDataLoadedRef.current = true;
          setKpiReady(true);
          return;
        }

        const pageData = await api.getAttendancePage(deptCode, date, { signal });
        if (signal?.aborted) return;
        const nextSummary = pageData.summary;
        const nextStaff = pageData.staff || [];
        setSummary(nextSummary);
        setStaff(nextStaff);
        commitDisplay(deptCode, nextSummary, nextStaff, deptList);
        hasDataLoadedRef.current = true;
        setKpiReady(true);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setSummary(null);
        setStaff([]);
        if (!hasDataLoadedRef.current) {
          resetKpi(null);
          resetScopeLabel('');
        }
        setError(err.message);
      } finally {
        if (!signal?.aborted && !silent) {
          setLoading(false);
        }
      }
    },
    [commitDisplay, resetKpi, resetScopeLabel],
  );

  useEffect(() => {
    if (deptLoading) return undefined;
    const controller = new AbortController();
    loadData(appliedDeptCode, appliedDate, departments, controller.signal);
    return () => controller.abort();
  }, [appliedDeptCode, appliedDate, departments, deptLoading, loadData]);

  const applyFilter = useCallback(() => {
    setAppliedDeptCode(draftDeptCode);
    setAppliedDate(draftDate);
  }, [draftDeptCode, draftDate]);

  const resetFilters = useCallback(() => {
    const { deptCode, date } = getDeptAttendanceDetailFilterDefaults();
    setDraftDeptCode(deptCode);
    setDraftDate(date);
    setAppliedDeptCode(deptCode);
    setAppliedDate(date);
    setError('');
  }, []);

  const selectedDept = useMemo(
    () => departments.find((d) => d.deptCode === appliedDeptCode),
    [departments, appliedDeptCode],
  );

  const { page, totalPages, paginated, goToPage } = usePagination(staff, pageSize);

  useEffect(() => {
    goToPage(1);
  }, [staff, goToPage]);

  const combinedLoading = deptLoading || loading;
  const { initialLoading, refreshing } = useLoadingPhase(combinedLoading);
  const showKpiSpinner = !kpiReady && combinedLoading;

  const handleExport = useCallback(async () => {
    if (!staff.length) return;
    setExporting(true);
    try {
      const { dashboard: d } = ADMIN_UI;
      const headers = [
        'Họ và tên',
        'Mã nhân viên',
        'Cấp bậc',
        'Chức vụ',
        'Vào sáng',
        'Ra trưa',
        'Vào chiều',
        'Ra chiều',
        'Trạng thái',
        'Đi trễ kèm',
        'Máy',
        'Ghi chú',
      ];
      const hm = (value) => formatInstantHm(value) || '';
      const rows = staff.map((s) => [
        s.fullname,
        s.empCodeFormatted,
        s.rankName || '',
        s.positionName || '',
        hm(s.morningInAt || s.checkInAt),
        hm(s.noonOutAt),
        hm(s.afternoonInAt),
        hm(s.afternoonOutAt || s.checkOutAt),
        statusLabel(s.status),
        s.lateFlag ? '+ Đi trễ' : '',
        formatKioskMachineParts(s.lastKioskLabel, s.lastKioskHostname, s.lastKioskIp) || '',
        s.note || '',
      ]);
      downloadExcel({
        filename: d.deptDetailExportFilename,
        sheetName: d.deptDetailExportSheet,
        headers,
        rows,
      });
    } finally {
      setExporting(false);
    }
  }, [staff, statusLabel]);

  const fillAttendanceTimes = useCallback(
    async (body) => {
      const updated = await adminApi.fillAttendanceTimes(body);
      setStaff((prev) =>
        prev.map((row) => (row.empCode === updated.empCode ? { ...row, ...updated } : row)),
      );
      await loadData(appliedDeptCode, appliedDate, departments, undefined);
      return updated;
    },
    [appliedDate, appliedDeptCode, departments, loadData],
  );

  const clearAttendanceDay = useCallback(
    async (body) => {
      const updated = await adminApi.clearAttendance(body);
      setStaff((prev) =>
        prev.map((row) => (row.empCode === updated.empCode ? { ...row, ...updated } : row)),
      );
      await loadData(appliedDeptCode, appliedDate, departments, undefined);
      return updated;
    },
    [appliedDate, appliedDeptCode, departments, loadData],
  );

  const saveVeSomNote = useCallback(
    async (empCode, note) => {
      await api.updateAttendance(empCode, 'VE_SOM', note, appliedDate);
      await loadData(appliedDeptCode, appliedDate, departments, undefined);
    },
    [appliedDate, appliedDeptCode, departments, loadData],
  );

  const saveManualRange = useCallback(
    async ({ empCode, status, fromDate, toDate, note }) => {
      const result = await api.updateAttendanceManualRange({
        empCode,
        status,
        fromDate,
        toDate,
        note,
      });
      await loadData(appliedDeptCode, appliedDate, departments, undefined);
      return result;
    },
    [appliedDate, appliedDeptCode, departments, loadData],
  );

  const assignNghiTrucWizard = useCallback(
    async ({ empCode, fromDate, toDate, reason, payrollIntent, note }) => {
      const result = await api.assignNghiTrucWizard({
        empCode,
        fromDate,
        toDate,
        reason,
        payrollIntent,
        note,
      });
      await loadData(appliedDeptCode, appliedDate, departments, undefined);
      return result;
    },
    [appliedDate, appliedDeptCode, departments, loadData],
  );

  const approvePayrollFill = useCallback(
    async (body) => {
      const updated = await adminApi.approvePayrollFill(body);
      setStaff((prev) =>
        prev.map((row) => (row.empCode === updated.empCode ? { ...row, ...updated } : row)),
      );
      await loadData(appliedDeptCode, appliedDate, departments, undefined);
      return updated;
    },
    [appliedDate, appliedDeptCode, departments, loadData],
  );

  const unlockDepartment = useCallback(
    async (reason) => {
      if (appliedDeptCode == null) return;
      await api.unlockDepartment(appliedDeptCode, reason, appliedDate);
      await loadData(appliedDeptCode, appliedDate, departments, undefined);
    },
    [appliedDate, appliedDeptCode, departments, loadData],
  );

  const relockDepartment = useCallback(async () => {
    if (appliedDeptCode == null) return;
    await api.relockDepartment(appliedDeptCode, appliedDate);
    await loadData(appliedDeptCode, appliedDate, departments, undefined);
  }, [appliedDate, appliedDeptCode, departments, loadData]);

  const approveUnlockRequest = useCallback(async () => {
    const id = summary?.unlockRequestId;
    if (id == null) return;
    await adminApi.approveUnlockRequest(id);
    await loadData(appliedDeptCode, appliedDate, departments, undefined);
  }, [summary?.unlockRequestId, appliedDate, appliedDeptCode, departments, loadData]);

  return {
    departments,
    draftDeptCode,
    setDraftDeptCode,
    draftDate,
    setDraftDate,
    applyFilter,
    resetFilters,
    summary,
    displayKpi,
    displayScopeLabel,
    staff,
    paginated,
    initialLoading,
    refreshing,
    showKpiSpinner,
    kpiReady,
    error,
    page,
    totalPages,
    pageSize,
    goToPage,
    filteredCount: staff.length,
    selectedDept,
    appliedDate,
    appliedDeptCode,
    exporting,
    handleExport,
    fillAttendanceTimes,
    clearAttendanceDay,
    saveManualRange,
    assignNghiTrucWizard,
    saveVeSomNote,
    approvePayrollFill,
    unlockDepartment,
    relockDepartment,
    approveUnlockRequest,
  };
}
