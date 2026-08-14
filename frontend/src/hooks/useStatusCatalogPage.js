import { useState, useCallback, useEffect, useMemo } from 'react';
import { ADMIN_UI } from '../constants/admin';
import {
  STATUS_CATALOG_EXCEL,
  buildStatusCatalogExportSheet,
} from '../constants/excelRegistry';
import { mapStatusCatalogImportRows } from '../utils/excelImport';
import { getTextSearchFilterDefaults } from '../utils/filterResetDefaults';
import { useStatusCatalog } from './useStatusCatalog';
import { useFlashMessage } from './useFlashMessage';
import { usePagination } from './usePagination';
import { useExcelRegistryActions } from './useExcelRegistryActions';
import { useResponsivePageSize } from './useResponsivePageSize';

export function useStatusCatalogPage() {
  const pageSize = useResponsivePageSize();
  const { items, stats, loading, initialLoading, refreshing, error, create, update, remove } = useStatusCatalog();
  const { flash, showSuccess, showError, showWarning, clearFlash } = useFlashMessage();

  const [search, setSearch] = useState('');
  const [formItem, setFormItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.code.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.badgeLabel.toLowerCase().includes(q),
    );
  }, [items, search]);

  const { page, totalPages, paginated, goToPage } = usePagination(filtered, pageSize);

  useEffect(() => {
    goToPage(1);
  }, [search, goToPage]);

  const resetFilters = useCallback(() => {
    setSearch(getTextSearchFilterDefaults().search);
  }, []);

  const buildExportSheet = useCallback(
    () => buildStatusCatalogExportSheet(filtered),
    [filtered],
  );

  const mapImportRows = useCallback((rows) => mapStatusCatalogImportRows(rows), []);

  const {
    importing,
    handleTemplateDownload,
    handleExport,
    handleImportFile,
  } = useExcelRegistryActions({
    excelConfig: STATUS_CATALOG_EXCEL,
    buildExportSheet,
    mapImportRows,
    createRecord: create,
    showSuccess,
    showWarning,
    showError,
  });

  const handleSave = useCallback(
    async (payload, editId) => {
      if (editId != null) {
        await update(editId, payload);
        showSuccess(ADMIN_UI.flash.statusUpdateSuccess);
      } else {
        await create(payload);
        showSuccess(ADMIN_UI.flash.statusCreateSuccess);
      }
    },
    [create, update, showSuccess],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteItem) return;
    const name = deleteItem.label;
    setDeleteLoading(true);
    try {
      await remove(deleteItem.id);
      setDeleteItem(null);
      showSuccess(ADMIN_UI.flash.statusDeleteSuccess(name));
    } catch (err) {
      showError(err.message || ADMIN_UI.flash.statusDeleteFail);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteItem, remove, showSuccess, showError]);

  return {
    items,
    search,
    setSearch,
    resetFilters,
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
    formItem,
    setFormItem,
    deleteItem,
    setDeleteItem,
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
