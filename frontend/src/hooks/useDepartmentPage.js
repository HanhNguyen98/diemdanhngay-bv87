import { useState, useMemo, useCallback, useEffect } from 'react';

import { ADMIN_UI } from '../constants/admin';

import {

  DEPARTMENT_EXCEL,

  buildDepartmentExportSheet,

} from '../constants/excelRegistry';

import { useDepartments } from './useDepartments';
import { useStaff } from './useStaff';

import { useFlashMessage } from './useFlashMessage';

import { usePagination } from './usePagination';

import { useExcelRegistryActions } from './useExcelRegistryActions';

import { mapDepartmentImportRows } from '../utils/excelImport';
import { ATTENDANCE_PAGE_SIZE } from '../constants/attendance';

const PAGE_SIZE = ATTENDANCE_PAGE_SIZE;



export function useDepartmentPage() {

  const { items, stats, loading, error, create, update, remove } = useDepartments();
  const { items: staffList } = useStaff('');

  const { flash, showSuccess, showWarning, showError, clearFlash } = useFlashMessage();

  const [search, setSearch] = useState('');



  const [formDept, setFormDept] = useState(null);

  const [deleteDept, setDeleteDept] = useState(null);

  const [deleteLoading, setDeleteLoading] = useState(false);

  const [viewDept, setViewDept] = useState(null);



  const filtered = useMemo(() => {

    if (!search.trim()) return items;

    const q = search.toLowerCase();

    return items.filter(

      (d) =>

        d.deptName.toLowerCase().includes(q) ||

        d.deptCodeFormatted.includes(q) ||

        (d.location || '').toLowerCase().includes(q) ||

        (d.headName || '').toLowerCase().includes(q),

    );

  }, [items, search]);



  const { page, totalPages, paginated, pageSize, goToPage } = usePagination(filtered, PAGE_SIZE);



  useEffect(() => {

    goToPage(1);

  }, [search, goToPage]);



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
    (rows) => mapDepartmentImportRows(rows, staffList),
    [staffList],
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

    stats,

    loading,

    error,

    paginated,

    filteredCount: filtered.length,

    page,

    totalPages,

    pageSize,

    goToPage,

    staffList,

    formDept,

    setFormDept,

    deleteDept,

    setDeleteDept,

    deleteLoading,

    viewDept,

    setViewDept,

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


