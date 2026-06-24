import { useState, useCallback, useEffect } from 'react';
import { ADMIN_UI } from '../constants/admin';
import { ACCOUNT_ROLE_FILTER, ACCOUNT_STATUS_FILTER } from '../constants/adminFilters';
import { getAccountFilterDefaults } from '../utils/filterResetDefaults';
import { adminApi } from '../services/api';
import { useDepartments } from './useDepartments';
import { useFlashMessage } from './useFlashMessage';
import { useLoadingPhase } from './useLoadingPhase';
import { useResponsivePageSize } from './useResponsivePageSize';

function buildAccountPayload(account, overrides = {}) {
  const payload = {
    username: account.username,
    role: account.role,
    active: overrides.active ?? account.active !== false,
  };
  if (account.role === 'HEAD') {
    payload.empCode = account.empCode;
    payload.deptCode = account.deptCode;
    payload.fullname = account.fullname;
  } else {
    payload.fullname = account.fullname;
    payload.deptCode = null;
    payload.empCode = null;
  }
  return payload;
}

export function useAccountsPage() {
  const pageSize = useResponsivePageSize();
  const { items: departments } = useDepartments();
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [formStaffList, setFormStaffList] = useState([]);
  const [formAccounts, setFormAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(ACCOUNT_ROLE_FILTER.ALL);
  const [statusFilter, setStatusFilter] = useState(ACCOUNT_STATUS_FILTER.ALL);
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState(null);
  const { flash, showSuccess, showError, clearFlash } = useFlashMessage();

  const [formAccount, setFormAccount] = useState(null);
  const [deleteAccount, setDeleteAccount] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resetAccount, setResetAccount] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminApi.getAccountStats();
      setStats(data);
    } catch {
      setStats(null);
    }
  }, []);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.listAccounts({
        search,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page,
        pageSize,
        signal,
      });
      if (signal?.aborted) return;
      setItems(result.items ?? []);
      setTotalItems(result.totalItems ?? 0);
      setTotalPages(Math.max(1, result.totalPages ?? 1));
    } catch (err) {
      if (err.name === 'AbortError') return;
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
      setError(err.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page, pageSize]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => load(controller.signal), 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, pageSize]);

  const loadFormRefs = useCallback(async () => {
    try {
      const [accountsResult, staffResult] = await Promise.all([
        adminApi.listAccounts({ page: 1, pageSize: 500 }),
        adminApi.listStaff({ page: 1, pageSize: 500 }),
      ]);
      setFormAccounts(accountsResult.items ?? []);
      setFormStaffList(staffResult.items ?? []);
    } catch {
      setFormAccounts([]);
      setFormStaffList([]);
    }
  }, []);

  useEffect(() => {
    if (formAccount != null) {
      loadFormRefs();
    }
  }, [formAccount, loadFormRefs]);

  const goToPage = useCallback(
    (next) => {
      setPage((current) => Math.min(Math.max(1, next), totalPages));
    },
    [totalPages],
  );

  const handleSave = useCallback(
    async (payload, editId) => {
      if (editId != null) {
        await adminApi.updateAccount(editId, payload);
        showSuccess(ADMIN_UI.flash.accountUpdateSuccess);
      } else {
        await adminApi.createAccount(payload);
        showSuccess(ADMIN_UI.flash.accountCreateSuccess);
      }
      await Promise.all([load(), loadStats()]);
    },
    [load, loadStats, showSuccess],
  );

  const handleResetPassword = useCallback(
    async (newPassword, confirmPassword) => {
      if (!resetAccount) return;
      await adminApi.resetAccountPassword(resetAccount.id, newPassword, confirmPassword);
      showSuccess(ADMIN_UI.flash.accountResetPasswordSuccess(resetAccount.username));
      setResetAccount(null);
    },
    [resetAccount, showSuccess],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteAccount) return;
    const name = deleteAccount.username;
    setDeleteLoading(true);
    try {
      await adminApi.deleteAccount(deleteAccount.id);
      setDeleteAccount(null);
      showSuccess(ADMIN_UI.flash.accountDeleteSuccess(name));
      await Promise.all([load(), loadStats()]);
    } catch (err) {
      showError(err.message || ADMIN_UI.flash.accountDeleteFail);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteAccount, load, loadStats, showSuccess, showError]);

  const handleToggleActive = useCallback(
    async (account) => {
      setTogglingId(account.id);
      try {
        const nextActive = account.active === false;
        await adminApi.updateAccount(
          account.id,
          buildAccountPayload(account, { active: nextActive }),
        );
        showSuccess(ADMIN_UI.flash.accountUpdateSuccess);
        await Promise.all([load(), loadStats()]);
      } catch (err) {
        showError(err.message);
      } finally {
        setTogglingId(null);
      }
    },
    [load, loadStats, showSuccess, showError],
  );

  const resetFilters = useCallback(() => {
    const { search: nextSearch, role, status } = getAccountFilterDefaults();
    setSearch(nextSearch);
    setRoleFilter(role);
    setStatusFilter(status);
  }, []);

  const { initialLoading, refreshing } = useLoadingPhase(loading);

  return {
    departments,
    staffList: formStaffList,
    items,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    resetFilters,
    togglingId,
    stats,
    loading,
    initialLoading,
    refreshing,
    error,
    paginated: items,
    filteredCount: totalItems,
    page,
    totalPages,
    pageSize,
    goToPage,
    formAccount,
    setFormAccount,
    deleteAccount,
    setDeleteAccount,
    deleteLoading,
    resetAccount,
    setResetAccount,
    handleResetPassword,
    handleSave,
    handleDelete,
    handleToggleActive,
    formAccounts,
    flash,
    clearFlash,
  };
}
