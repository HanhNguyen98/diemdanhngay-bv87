import { useState, useCallback, useEffect } from 'react';
import { ADMIN_UI } from '../constants/admin';
import {
  STAFF_EXCEL,
  buildStaffExportSheet,
} from '../constants/excelRegistry';
import { useStaff } from './useStaff';
import { useDepartments } from './useDepartments';
import { useFlashMessage } from './useFlashMessage';
import { useExcelRegistryActions } from './useExcelRegistryActions';
import { mapStaffImportRows } from '../utils/excelImport';
import { getStaffRegistryFilterDefaults } from '../utils/filterResetDefaults';
import { ATTENDANCE_PAGE_SIZE } from '../constants/attendance';
import { useStaffCatalogOptions } from './useStaffCatalogOptions';

const PAGE_SIZE = ATTENDANCE_PAGE_SIZE;

export function useStaffPage() {
  const { items: departments } = useDepartments();
  const [page, setPage] = useState(1);
  const {
    items,
    totalItems,
    totalPages,
    stats,
    loading,
    initialLoading,
    refreshing,
    error,
    search,
    setSearch,
    deptFilter,
    setDeptFilter,
    fetchAllFiltered,
    create,
    update,
    remove,
  } = useStaff({ page, pageSize: PAGE_SIZE });
  const { rankNames, positionNames } = useStaffCatalogOptions();
  const { flash, showSuccess, showWarning, showError, clearFlash } = useFlashMessage();

  const [formStaff, setFormStaff] = useState(null);
  const [deleteStaff, setDeleteStaff] = useState(null);
  const [historyStaff, setHistoryStaff] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [deptFilter, search]);

  const goToPage = useCallback(
    (next) => {
      setPage((current) => Math.min(Math.max(1, next), totalPages));
    },
    [totalPages],
  );

  const resetFilters = useCallback(() => {
    const { search: nextSearch, deptCode } = getStaffRegistryFilterDefaults();
    setSearch(nextSearch);
    setDeptFilter(deptCode);
  }, [setSearch, setDeptFilter]);

  const handleSave = useCallback(
    async (payload, editCode) => {
      if (editCode != null) {
        await update(editCode, payload);
        if (payload.revokeHeadOnTransfer) {
          showSuccess(ADMIN_UI.flash.staffTransferHeadRevokeSuccess);
        } else {
          showSuccess(ADMIN_UI.flash.staffUpdateSuccess);
        }
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

  const buildExportSheet = useCallback(async () => {
    const rows = await fetchAllFiltered();
    return buildStaffExportSheet(rows);
  }, [fetchAllFiltered]);

  const mapImportRows = useCallback(
    (rows) => mapStaffImportRows(rows, departments, { rankNames, positionNames }),
    [departments, rankNames, positionNames],
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
    resetFilters,
    stats,
    loading,
    initialLoading,
    refreshing,
    error,
    paginated: items,
    filteredCount: totalItems,
    page,
    totalPages,
    pageSize: PAGE_SIZE,
    goToPage,
    formStaff,
    setFormStaff,
    deleteStaff,
    setDeleteStaff,
    historyStaff,
    setHistoryStaff,
    deleteLoading,
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
