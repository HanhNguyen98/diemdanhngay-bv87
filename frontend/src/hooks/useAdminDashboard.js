import { useCallback, useEffect, useMemo, useState } from 'react';
import { ADMIN_UI } from '../constants/admin';
import { adminApi } from '../services/api';
import { api } from '../api/client';
import { formatDateDMY, formatTimeVN, todayISO } from '../utils/formatters';
import { useFlashMessage } from './useFlashMessage';

export function useAdminDashboard({ enabled = true } = {}) {
  const { flash, showSuccess, showError, clearFlash } = useFlashMessage();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [search, setSearch] = useState('');
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderSending, setReminderSending] = useState(false);
  const [selectedDeptCodes, setSelectedDeptCodes] = useState([]);
  const [unlockTarget, setUnlockTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboard = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const data = await adminApi.getDashboard();
      setDashboard(data);
    } catch (err) {
      showError(err.message || ADMIN_UI.flash.saveFail);
    } finally {
      setLoading(false);
    }
  }, [enabled, showError]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    fetchDashboard();
  }, [enabled, fetchDashboard]);

  const departments = dashboard?.departments || [];
  const incompleteDepts = useMemo(
    () => departments.filter((d) => d.completionStatus === 'INCOMPLETE'),
    [departments],
  );

  const filteredDepts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) => d.deptName?.toLowerCase().includes(q));
  }, [departments, search]);

  const openReminderModal = useCallback(() => {
    setSelectedDeptCodes(incompleteDepts.map((d) => d.deptCode));
    setReminderOpen(true);
  }, [incompleteDepts]);

  const toggleReminderDept = useCallback((deptCode) => {
    setSelectedDeptCodes((prev) =>
      prev.includes(deptCode) ? prev.filter((c) => c !== deptCode) : [...prev, deptCode],
    );
  }, []);

  const toggleReminderAll = useCallback(() => {
    setSelectedDeptCodes((prev) =>
      prev.length === incompleteDepts.length ? [] : incompleteDepts.map((d) => d.deptCode),
    );
  }, [incompleteDepts]);

  const sendReminders = useCallback(async () => {
    if (selectedDeptCodes.length === 0) {
      showError('Chọn ít nhất một ĐƠN VỊ.');
      return;
    }
    setReminderSending(true);
    try {
      const result = await adminApi.sendReminders(selectedDeptCodes);
      setReminderOpen(false);
      if (result.sent > 0) {
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
      await fetchDashboard();
    } catch (err) {
      showError(err.message || ADMIN_UI.flash.saveFail);
    } finally {
      setReminderSending(false);
    }
  }, [fetchDashboard, selectedDeptCodes, showError, showSuccess]);

  const handleUnlockConfirm = useCallback(
    async (reason) => {
      await api.unlockDepartment(unlockTarget.deptCode, reason);
      showSuccess(`Đã mở khóa chỉnh sửa cho ${unlockTarget.deptName}`);
      setUnlockTarget(null);
      await fetchDashboard();
    },
    [fetchDashboard, showSuccess, unlockTarget],
  );

  const blockReport = useCallback(
    async (dept) => {
      setActionLoading(true);
      try {
        await adminApi.blockReport(dept.deptCode, ADMIN_UI.dashboard.blockReportReason);
        showSuccess(`Đã khóa gửi báo cáo — ${dept.deptName}`);
        await fetchDashboard();
      } catch (err) {
        showError(err.message);
      } finally {
        setActionLoading(false);
      }
    },
    [fetchDashboard, showError, showSuccess],
  );

  const unblockReport = useCallback(
    async (dept) => {
      setActionLoading(true);
      try {
        await adminApi.unblockReport(dept.deptCode);
        showSuccess(`Đã mở khóa gửi báo cáo — ${dept.deptName}`);
        await fetchDashboard();
      } catch (err) {
        showError(err.message);
      } finally {
        setActionLoading(false);
      }
    },
    [fetchDashboard, showError, showSuccess],
  );

  const headerMeta = useMemo(() => {
    const now = new Date();
    return {
      time: formatTimeVN(now),
      date: formatDateDMY(dashboard?.attendanceDate || todayISO()),
    };
  }, [dashboard?.attendanceDate]);

  return {
    loading,
    dashboard,
    kpi: dashboard?.kpi,
    filteredDepts,
    incompleteDepts,
    search,
    setSearch,
    headerMeta,
    reminderOpen,
    setReminderOpen,
    openReminderModal,
    selectedDeptCodes,
    toggleReminderDept,
    toggleReminderAll,
    sendReminders,
    reminderSending,
    unlockTarget,
    setUnlockTarget,
    handleUnlockConfirm,
    blockReport,
    unblockReport,
    actionLoading,
    flash,
    clearFlash,
    refresh: fetchDashboard,
  };
}
