import { useState, useMemo, useCallback, useEffect } from 'react';

import { ADMIN_UI } from '../constants/admin';

import {
  DEPARTMENT_EXCEL,
  buildDepartmentExportSheet,
} from '../constants/excelRegistry';

import { useDepartments } from './useDepartments';
import { useDepartmentGroups } from './useDepartmentGroups';
import { adminApi } from '../services/api';

import { useFlashMessage } from './useFlashMessage';

import { usePagination } from './usePagination';

import { useExcelRegistryActions } from './useExcelRegistryActions';

import { mapDepartmentImportRows } from '../utils/excelImport';
import { getDepartmentRegistryFilterDefaults } from '../utils/filterResetDefaults';
import { useResponsivePageSize } from './useResponsivePageSize';

export function useDepartmentPage() {
  const pageSize = useResponsivePageSize();
  const { items, stats, loading, initialLoading, refreshing, error, create, update, remove, reload } = useDepartments();
  const {
    items: groups,
    reload: reloadGroups,
  } = useDepartmentGroups();

  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const { flash, showSuccess, showWarning, showError, clearFlash } = useFlashMessage();

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  const [formDept, setFormDept] = useState(null);

  const [deleteDept, setDeleteDept] = useState(null);

  const [deleteLoading, setDeleteLoading] = useState(false);

  const ensureStaffList = useCallback(async () => {
    if (staffList.length > 0) return staffList;
    setStaffLoading(true);
    try {
      const staffResult = await adminApi.listStaff({ page: 1, pageSize: 500 });
      setStaffList(staffResult.items ?? []);
      return staffResult.items ?? [];
    } finally {
      setStaffLoading(false);
    }
  }, [staffList]);

  useEffect(() => {
    if (formDept != null) {
      ensureStaffList();
    }
  }, [formDept, ensureStaffList]);

  const filtered = useMemo(() => {
    let list = items;
    if (groupFilter !== '') {
      list = list.filter((d) => d.groupCode === groupFilter);
    }
    if (!search.trim()) return list;

    const q = search.toLowerCase();

    return list.filter(
      (d) =>
        d.deptName.toLowerCase().includes(q) ||
        (d.unitCode || '').toLowerCase().includes(q) ||
        d.deptCodeFormatted.includes(q) ||
        (d.groupName || '').toLowerCase().includes(q) ||
        (d.headName || '').toLowerCase().includes(q),
    );
  }, [items, search, groupFilter]);

  const showGroupColumn = groupFilter === '';

  const { page, totalPages, paginated, goToPage } = usePagination(filtered, pageSize);

  useEffect(() => {
    goToPage(1);
  }, [search, groupFilter, goToPage]);

  const resetFilters = useCallback(() => {
    const { search: nextSearch, groupCode } = getDepartmentRegistryFilterDefaults();
    setSearch(nextSearch);
    setGroupFilter(groupCode);
  }, []);

  const handleSave = useCallback(
    async (payload, editCode) => {
      if (editCode != null) {
        await update(editCode, payload);
        showSuccess(ADMIN_UI.flash.deptUpdateSuccess);
      } else {
        await create(payload);
        showSuccess(ADMIN_UI.flash.deptCreateSuccess);
      }
    },
    [create, update, showSuccess],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteDept) return;

    const name = deleteDept.deptName;

    setDeleteLoading(true);

    try {
      await remove(deleteDept.deptCode);

      setDeleteDept(null);

      showSuccess(ADMIN_UI.flash.deptDeleteSuccess(name));
    } catch (err) {
      showError(err.message || ADMIN_UI.flash.deptDeleteFail);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteDept, remove, showSuccess, showError]);

  const buildExportSheet = useCallback(
    () => buildDepartmentExportSheet(filtered),
    [filtered],
  );

  const mapImportRows = useCallback(
    async (rows) => {
      const staff = await ensureStaffList();
      return mapDepartmentImportRows(rows, staff, groups);
    },
    [ensureStaffList, groups],
  );

  const {
    importing,
    handleTemplateDownload,
    handleExport,
    handleImportFile,
  } = useExcelRegistryActions({
    excelConfig: DEPARTMENT_EXCEL,
    buildExportSheet,
    mapImportRows,
    createRecord: create,
    showSuccess,
    showWarning,
    showError,
  });

  return {
    search,
    setSearch,
    groupFilter,
    setGroupFilter,
    resetFilters,
    groups,
    reloadGroups,
    showGroupColumn,
    defaultGroupCode: groupFilter !== '' ? groupFilter : null,
    stats,
    loading,
    initialLoading,
    refreshing,
    error,
    paginated,
    filteredCount: filtered.length,
    page,
    totalPages,
    pageSize,
    goToPage,
    staffList,
    staffLoading,
    formDept,
    setFormDept,
    deleteDept,
    setDeleteDept,
    deleteLoading,
    handleSave,
    handleDelete,
    importing,
    handleTemplateDownload,
    handleImportFile,
    handleExport,
    flash,
    clearFlash,
    reload,
  };
}
