import { useState, useCallback, useEffect, useMemo } from 'react';
import { ATTENDANCE_PAGE_SIZE } from '../constants/attendance';
import { useFlashMessage } from './useFlashMessage';
import { usePagination } from './usePagination';
import { useExcelRegistryActions } from './useExcelRegistryActions';
import { getTextSearchFilterDefaults } from '../utils/filterResetDefaults';

const PAGE_SIZE = ATTENDANCE_PAGE_SIZE;

/**
 * @param {{
 *   useCatalog: () => object,
 *   nameField: string,
 *   codeField: string,
 *   codeFormattedField: string,
 *   excelConfig: object,
 *   buildExportSheet: (filtered: object[]) => { headers: string[], rows: unknown[][] },
 *   mapImportRows: (rows: Record<string, string>[]) => { payloads: object[], errors: string[] },
 *   flash: { create: string, update: string, delete: (name: string) => string, deleteFail: string },
 * }} config
 */
export function useStaffAttributeCatalogPage(config) {
  const { items, stats, loading, initialLoading, refreshing, error, create, update, remove } = config.useCatalog();
  const { flash, showSuccess, showError, showWarning, clearFlash } = useFlashMessage();

  const [search, setSearch] = useState('');
  const [formItem, setFormItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => {
      const name = item[config.nameField] || '';
      const code = item[config.codeFormattedField] || String(item[config.codeField] ?? '');
      return name.toLowerCase().includes(q) || code.toLowerCase().includes(q);
    });
  }, [items, search, config]);

  const { page, totalPages, paginated, pageSize, goToPage } = usePagination(filtered, PAGE_SIZE);

  useEffect(() => {
    goToPage(1);
  }, [search, goToPage]);

  const resetFilters = useCallback(() => {
    setSearch(getTextSearchFilterDefaults().search);
  }, []);

  const buildExportSheet = useCallback(
    () => config.buildExportSheet(filtered),
    [config, filtered],
  );

  const mapImportRows = useCallback((rows) => config.mapImportRows(rows), [config]);

  const {
    importing,
    handleTemplateDownload,
    handleExport,
    handleImportFile,
  } = useExcelRegistryActions({
    excelConfig: config.excelConfig,
    buildExportSheet,
    mapImportRows,
    createRecord: create,
    showSuccess,
    showWarning,
    showError,
  });

  const handleSave = useCallback(
    async (payload, editCode) => {
      if (editCode != null) {
        await update(editCode, payload);
        showSuccess(config.flash.update);
      } else {
        await create(payload);
        showSuccess(config.flash.create);
      }
    },
    [create, update, showSuccess, config.flash],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteItem) return;
    const name = deleteItem[config.nameField];
    setDeleteLoading(true);
    try {
      await remove(deleteItem[config.codeField]);
      setDeleteItem(null);
      showSuccess(config.flash.delete(name));
    } catch (err) {
      showError(err.message || config.flash.deleteFail);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteItem, remove, showSuccess, showError, config]);

  const handleToggleActive = useCallback(
    async (item) => {
      if (!item) return;
      const payload = {
        [config.nameField]: item[config.nameField],
        sortOrder: item.sortOrder,
        active: !item.active,
      };
      await handleSave(payload, item[config.codeField]);
    },
    [handleSave, config],
  );

  return {
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
    handleToggleActive,
    importing,
    handleTemplateDownload,
    handleImportFile,
    handleExport,
    flash,
    clearFlash,
  };
}
