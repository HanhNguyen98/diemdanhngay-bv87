import { useState, useCallback, useEffect, useMemo } from 'react';
import { ADMIN_UI } from '../constants/admin';
import { adminApi } from '../services/api';
import { useDepartments } from './useDepartments';
import { useFlashMessage } from './useFlashMessage';
import { usePagination } from './usePagination';
import { ATTENDANCE_PAGE_SIZE } from '../constants/attendance';

const PAGE_SIZE = ATTENDANCE_PAGE_SIZE;

export function useAccountsPage() {
  const { items: departments } = useDepartments();
  const [items, setItems] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const { flash, showSuccess, showError, clearFlash } = useFlashMessage();

  const [formAccount, setFormAccount] = useState(null);
  const [deleteAccount, setDeleteAccount] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resetAccount, setResetAccount] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [accounts, staff] = await Promise.all([
        adminApi.listAccounts(),
        adminApi.listStaff(),
      ]);
      setItems(accounts);
      setStaffList(staff);
    } catch (err) {
      setItems([]);
      setStaffList([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (account) =>
        account.username.toLowerCase().includes(q) ||
        account.fullname.toLowerCase().includes(q) ||
        (account.empCodeFormatted || '').toLowerCase().includes(q) ||
        String(account.empCode ?? '').includes(q) ||
        (account.deptName || '').toLowerCase().includes(q) ||
        (account.roleLabel || '').toLowerCase().includes(q),
    );
  }, [items, search]);

  const { page, totalPages, paginated, pageSize, goToPage } = usePagination(filtered, PAGE_SIZE);

  useEffect(() => {
    goToPage(1);
  }, [search, goToPage]);

  const handleSave = useCallback(
    async (payload, editId) => {
      if (editId != null) {
        await adminApi.updateAccount(editId, payload);
        showSuccess(ADMIN_UI.flash.accountUpdateSuccess);
      } else {
        await adminApi.createAccount(payload);
        showSuccess(ADMIN_UI.flash.accountCreateSuccess);
      }
      await load();
    },
    [load, showSuccess],
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
      await load();
    } catch (err) {
      showError(err.message || ADMIN_UI.flash.accountDeleteFail);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteAccount, load, showSuccess, showError]);

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((a) => a.active).length,
      admin: items.filter((a) => a.role === 'ADMIN').length,
      head: items.filter((a) => a.role === 'HEAD').length,
    }),
    [items],
  );

  return {
    departments,
    staffList,
    items,
    search,
    setSearch,
    stats,
    loading,
    error,
    paginated,
    filteredCount: filtered.length,
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
    flash,
    clearFlash,
  };
}
