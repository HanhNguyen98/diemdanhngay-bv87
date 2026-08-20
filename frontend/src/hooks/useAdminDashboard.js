import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ADMIN_UI } from '../constants/admin';
import { adminApi } from '../services/api';
import { getDashboardDeptFilterDefaults } from '../utils/filterResetDefaults';
import { formatDateDMY, formatDeptFilterLabel, formatTimeVN, todayISO } from '../utils/formatters';
import { useFilterDraft } from './useFilterDraft';
import { useFlashMessage } from './useFlashMessage';

const POLL_INTERVAL_MS = 90_000;

function isWithinAttendancePollingWindow() {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
  );
  return hour >= 6 && hour < 16;
}

function patchDepartment(departments, deptCode, patch) {
  return departments.map((d) => (d.deptCode === deptCode ? { ...d, ...patch } : d));
}

export function useAdminDashboard({ enabled = true } = {}) {
  const { flash, showSuccess, showWarning, showError, clearFlash } = useFlashMessage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [deptFilter, setDeptFilter] = useState(null);
  const { draft: deptFilterDraftState, patchDraft: patchDeptFilterDraft } = useFilterDraft({
    dept: deptFilter,
  });
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderSending, setReminderSending] = useState(false);
  const [selectedDeptCodes, setSelectedDeptCodes] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const [departmentFilterOptions, setDepartmentFilterOptions] = useState([]);

  const dashboardAbortRef = useRef(null);
  const catalogAbortRef = useRef(null);

  const fetchDashboard = useCallback(
    async ({ silent = false } = {}) => {
      if (!enabled) return;

      dashboardAbortRef.current?.abort();
      const controller = new AbortController();
      dashboardAbortRef.current = controller;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const data = await adminApi.getDashboard({ signal: controller.signal });
        if (controller.signal.aborted) return;
        setDashboard(data);
      } catch (err) {
        if (err.name === 'AbortError') return;
        showError(err.message || ADMIN_UI.flash.saveFail);
      } finally {
        if (controller.signal.aborted) return;
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [enabled, showError],
  );

  useEffect(() => {
    return () => {
      dashboardAbortRef.current?.abort();
      catalogAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setDepartmentFilterOptions([]);
      return undefined;
    }

    catalogAbortRef.current?.abort();
    const controller = new AbortController();
    catalogAbortRef.current = controller;

    adminApi
      .listDepartments(undefined, { signal: controller.signal })
      .then((depts) => {
        if (!controller.signal.aborted) {
          setDepartmentFilterOptions(Array.isArray(depts) ? depts : []);
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setDepartmentFilterOptions([]);
      });

    return () => controller.abort();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    fetchDashboard();
  }, [enabled, fetchDashboard]);

  useEffect(() => {
    if (!enabled) return undefined;

    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      if (isWithinAttendancePollingWindow()) {
        fetchDashboard({ silent: true });
      }
    };

    const id = window.setInterval(tick, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isWithinAttendancePollingWindow()) {
        fetchDashboard({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled, fetchDashboard]);

  const departments = dashboard?.departments || [];

  const filteredDept = useMemo(
    () => (deptFilter != null ? departments.find((d) => d.deptCode === deptFilter) : null),
    [departments, deptFilter],
  );

  const displayKpi = useMemo(() => {
    if (filteredDept) {
      return {
        total: filteredDept.total,
        statusBreakdown: filteredDept.statusBreakdown ?? [],
        unchecked: filteredDept.uncheckedCount ?? 0,
      };
    }
    return dashboard?.kpi ?? null;
  }, [filteredDept, dashboard?.kpi]);

  const kpiScopeLabel = useMemo(() => {
    const { dashboard: d } = ADMIN_UI;
    if (deptFilter == null) {
      return d.kpiScopeHospital;
    }
    const catalogDept = departmentFilterOptions.find((item) => item.deptCode === deptFilter);
    const label = formatDeptFilterLabel(catalogDept ?? filteredDept);
    return d.kpiScopeDept(label);
  }, [deptFilter, departmentFilterOptions, filteredDept]);

  const incompleteDepts = useMemo(
    () => departments.filter((d) => d.completionStatus === 'INCOMPLETE'),
    [departments],
  );

  const remindableDepts = useMemo(
    () => incompleteDepts.filter((d) => d.hasActiveHeadAccount === true),
    [incompleteDepts],
  );

  const filteredDepts = useMemo(() => {
    if (deptFilter == null) return departments;
    return departments.filter((d) => d.deptCode === deptFilter);
  }, [departments, deptFilter]);

  const openReminderModal = useCallback(() => {
    setSelectedDeptCodes(remindableDepts.map((d) => d.deptCode));
    setReminderOpen(true);
  }, [remindableDepts]);

  const toggleReminderDept = useCallback(
    (deptCode) => {
      const dept = incompleteDepts.find((d) => d.deptCode === deptCode);
      if (!dept?.hasActiveHeadAccount) return;
      setSelectedDeptCodes((prev) =>
        prev.includes(deptCode) ? prev.filter((c) => c !== deptCode) : [...prev, deptCode],
      );
    },
    [incompleteDepts],
  );

  const toggleReminderAll = useCallback(() => {
    setSelectedDeptCodes((prev) =>
      prev.length === remindableDepts.length ? [] : remindableDepts.map((d) => d.deptCode),
    );
  }, [remindableDepts]);

  const sendReminders = useCallback(async () => {
    if (selectedDeptCodes.length === 0) {
      showError('Chọn ít nhất một ĐƠN VỊ.');
      return;
    }
    setReminderSending(true);
    try {
      const result = await adminApi.sendReminders(selectedDeptCodes);
      setReminderOpen(false);
      const skipped = result.skippedNoHead ?? 0;
      const sent = result.sent ?? 0;
      if (sent > 0 && skipped === 0) {
        showSuccess(result.message);
      } else if (sent > 0 && skipped > 0) {
        showWarning(result.message);
      } else if (skipped > 0) {
        showWarning(result.message);
      } else {
        showError(result.message);
      }
      await fetchDashboard({ silent: true });
    } catch (err) {
      showError(err.message || ADMIN_UI.flash.saveFail);
    } finally {
      setReminderSending(false);
    }
  }, [fetchDashboard, selectedDeptCodes, showError, showSuccess, showWarning]);

  const toggleDeptLock = useCallback(
    async (dept) => {
      setPendingAction({ deptCode: dept.deptCode, type: 'lock' });
      try {
        const result = await adminApi.toggleDeptLock(dept.deptCode);
        showSuccess(result.message);
        setDashboard((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            departments: patchDepartment(prev.departments, dept.deptCode, {
              locked: result.locked,
              manualLocked: result.manualLocked,
              unlocked: result.unlocked,
            }),
          };
        });
      } catch (err) {
        showError(err.message);
      } finally {
        setPendingAction(null);
      }
    },
    [showError, showSuccess],
  );

  const toggleReportBlock = useCallback(
    async (dept) => {
      if (dept.reportSubmitted) return;

      setPendingAction({ deptCode: dept.deptCode, type: 'report' });
      try {
        if (dept.reportBlocked) {
          await adminApi.unblockReport(dept.deptCode);
          showSuccess('Đã mở chỉnh sửa HEAD cho ĐƠN VỊ');
        } else {
          await adminApi.blockReport(dept.deptCode, ADMIN_UI.dashboard.blockReportReason);
          showSuccess('Đã khóa chỉnh sửa HEAD cho ĐƠN VỊ');
        }
        setDashboard((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            departments: patchDepartment(prev.departments, dept.deptCode, {
              reportBlocked: !dept.reportBlocked,
            }),
          };
        });
      } catch (err) {
        showError(err.message);
      } finally {
        setPendingAction(null);
      }
    },
    [showError, showSuccess],
  );

  const headerMeta = useMemo(() => {
    const now = new Date();
    return {
      time: formatTimeVN(now),
      date: formatDateDMY(dashboard?.attendanceDate || todayISO()),
    };
  }, [dashboard?.attendanceDate]);

  const isActionPending = useCallback(
    (deptCode, type) =>
      pendingAction?.deptCode === deptCode && pendingAction?.type === type,
    [pendingAction],
  );

  const refresh = useCallback(
    () => fetchDashboard({ silent: Boolean(dashboard) }),
    [dashboard, fetchDashboard],
  );

  const applyDeptFilter = useCallback(() => {
    setDeptFilter(deptFilterDraftState.dept);
  }, [deptFilterDraftState.dept]);

  const resetDeptFilter = useCallback(() => {
    const { dept } = getDashboardDeptFilterDefaults();
    patchDeptFilterDraft({ dept });
    setDeptFilter(dept);
  }, [patchDeptFilterDraft]);

  return useMemo(
    () => ({
      loading,
      refreshing,
      dashboard,
      kpi: dashboard?.kpi,
      displayKpi,
      kpiScopeLabel,
      departments,
      departmentFilterOptions,
      filteredDepts,
      incompleteDepts,
      remindableDepts,
      deptFilter,
      deptFilterDraft: deptFilterDraftState.dept,
      patchDeptFilterDraft,
      applyDeptFilter,
      setDeptFilter,
      resetDeptFilter,
      headerMeta,
      reminderOpen,
      setReminderOpen,
      openReminderModal,
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
      refresh,
    }),
    [
      loading,
      refreshing,
      dashboard,
      displayKpi,
      kpiScopeLabel,
      departments,
      departmentFilterOptions,
      filteredDepts,
      incompleteDepts,
      remindableDepts,
      deptFilter,
      deptFilterDraftState.dept,
      patchDeptFilterDraft,
      applyDeptFilter,
      resetDeptFilter,
      headerMeta,
      reminderOpen,
      openReminderModal,
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
      refresh,
    ],
  );
}
