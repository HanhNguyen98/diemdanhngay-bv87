import { useState, useCallback, useEffect, useMemo } from 'react';
import { ADMIN_UI } from '../constants/admin';
import {
  STAFF_EXCEL,
  buildStaffExportSheet,
} from '../constants/excelRegistry';
import { useStaff } from './useStaff';
import { useDepartments } from './useDepartments';
import { useFlashMessage } from './useFlashMessage';
import { usePagination } from './usePagination';
import { useExcelRegistryActions } from './useExcelRegistryActions';
import { mapStaffImportRows } from '../utils/excelImport';
import { ATTENDANCE_PAGE_SIZE } from '../constants/attendance';

const PAGE_SIZE = ATTENDANCE_PAGE_SIZE;

export function useStaffPage() {
  const { items: departments } = useDepartments();
  const {
    items,
    stats,
    loading,
    error,
    search,
    setSearch,
    deptFilter,
    setDeptFilter,
    create,
    update,
    remove,
  } = useStaff('');
  const { flash, showSuccess, showWarning, showError, clearFlash } = useFlashMessage();

  const [formStaff, setFormStaff] = useState(null);
  const [deleteStaff, setDeleteStaff] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewStaff, setViewStaff] = useState(null);

  const filtered = useMemo(() => items, [items]);

  const { page, totalPages, paginated, pageSize, goToPage } = usePagination(filtered, PAGE_SIZE);

  useEffect(() => {
    goToPage(1);
  }, [deptFilter, search, goToPage]);

  const handleSave = useCallback(
    async (payload, editCode) => {
      if (editCode != null) {
        await update(editCode, payload);
        showSuccess(ADMIN_UI.flash.staffUpdateSuccess);
      } else {
        await create(payload);
        showSuccess(ADMIN_UI.flash.staffCreateSuccess);
      }
    },
    [create, update, showSuccess],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteStaff) return;
    const name = deleteStaff.fullname;
    setDeleteLoading(true);
    try {
      await remove(deleteStaff.empCode);
      setDeleteStaff(null);
      showSuccess(ADMIN_UI.flash.staffDeleteSuccess(name));
    } catch (err) {
      showError(err.message || ADMIN_UI.flash.staffDeleteFail);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteStaff, remove, showSuccess, showError]);

  const buildExportSheet = useCallback(
    () => buildStaffExportSheet(filtered),
    [filtered],
  );

  const mapImportRows = useCallback(
    (rows) => mapStaffImportRows(rows, departments),
    [departments],
  );

  const {
    importing,
    handleTemplateDownload,
    handleExport,
    handleImportFile,
  } = useExcelRegistryActions({
    excelConfig: STAFF_EXCEL,
    buildExportSheet,
    mapImportRows,
    createRecord: create,
    showSuccess,
    showWarning,
    showError,
  });

  return {
    departments,
    search,
    setSearch,
    deptFilter,
    setDeptFilter,
    stats,
    loading,
    error,
    paginated,
    filteredCount: filtered.length,
    page,
    totalPages,
    pageSize,
    goToPage,
    formStaff,
    setFormStaff,
    deleteStaff,
    setDeleteStaff,
    deleteLoading,
    viewStaff,
    setViewStaff,
    handleSave,
    handleDelete,
    importing,
    handleTemplateDownload,
    handleImportFile,
    handleExport,
    flash,
    clearFlash,
  };
}

