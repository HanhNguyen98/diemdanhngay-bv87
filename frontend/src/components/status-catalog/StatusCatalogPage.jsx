import { lazy, Suspense, useCallback } from 'react';
import { ADMIN_UI, MOBILE_REGISTRY_PAGINATION_CLASS } from '../../constants/admin';
import { useStatusCatalogPage } from '../../hooks/useStatusCatalogPage';
import AdminCatalogBreadcrumb from '../admin/sections/AdminCatalogBreadcrumb';
import RegistryTableShell from '../admin/sections/RegistryTableShell';
import TablePagination from '../admin/sections/TablePagination';
import MobilePagination from '../shared/MobilePagination';
import StatusCatalogFilterBar from './StatusCatalogFilterBar';
import StatusCatalogStatGrid from './StatusCatalogStatGrid';
import StatusCatalogTable from './StatusCatalogTable';
import StatusCatalogCardList from './StatusCatalogCardList';
import FlashBanner from '../shared/FlashBanner';
import InlineErrorBanner from '../shared/InlineErrorBanner';
import ExcelTaskMenu from '../admin/sections/ExcelTaskMenu';

const StatusCatalogFormModal = lazy(() => import('./StatusCatalogFormModal'));
const DeleteModal = lazy(() => import('../shared/DeleteModal'));

export default function StatusCatalogPage() {
  const {
    search,
    setSearch,
    resetFilters,
    stats,
    loading,
    initialLoading,
    refreshing,
    error,
    paginated,
    filteredCount,
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
  } = useStatusCatalogPage();

  const handleToggleActive = useCallback(
    async (item) => {
      if (!item) return;

      const payload = {
        code: item.code,
        label: item.label,
        badgeLabel: item.badgeLabel,
        colorKey: item.colorKey,
        iconKey: item.iconKey,
        sortOrder: item.sortOrder,
        active: !item.active,
      };

      await handleSave(payload, item.id);
    },
    [handleSave],
  );

  return (
    <>
      <AdminCatalogBreadcrumb currentLabelKey="statusCatalog" />

      <div className="flex flex-col gap-2 lg:h-full lg:min-h-0">
        {flash && <FlashBanner flash={flash} onClose={clearFlash} />}
        <InlineErrorBanner message={error} />

        <div className="shrink-0">
          <StatusCatalogStatGrid stats={stats} />
        </div>

        <RegistryTableShell
          toolbar={
            <StatusCatalogFilterBar
              search={search}
              onSearchChange={setSearch}
              onAdd={() => setFormItem({})}
              onResetFilters={resetFilters}
              loading={initialLoading}
              excelControl={
                <ExcelTaskMenu
                  onTemplate={handleTemplateDownload}
                  onImport={handleImportFile}
                  onExport={handleExport}
                  importing={importing}
                  disabled={initialLoading}
                />
              }
            />
          }
          initialLoading={initialLoading}
          refreshing={refreshing}
          loadingLabel={ADMIN_UI.loading}
          footer={
            <>
              <div className="hidden lg:block">
                <TablePagination
                  page={page}
                  totalPages={totalPages}
                  totalItems={filteredCount}
                  pageSize={pageSize}
                  onPageChange={goToPage}
                  unitLabel={ADMIN_UI.statusCatalog.unitLabel}
                />
              </div>
              {!initialLoading && (
                <MobilePagination
                  sticky={false}
                  className={MOBILE_REGISTRY_PAGINATION_CLASS}
                  page={page}
                  totalPages={totalPages}
                  totalItems={filteredCount}
                  onPageChange={goToPage}
                />
              )}
            </>
          }
          className="lg:flex-1 lg:min-h-0"
        >
          <div className="lg:hidden">
            <StatusCatalogCardList
              items={paginated}
              onEdit={setFormItem}
              onDelete={setDeleteItem}
              onToggleActive={handleToggleActive}
            />
          </div>

          <div className="hidden lg:block">
            <StatusCatalogTable items={paginated} onEdit={setFormItem} onDelete={setDeleteItem} />
          </div>
        </RegistryTableShell>

        <Suspense fallback={null}>
          {formItem && (
            <StatusCatalogFormModal
              initial={formItem.id ? formItem : null}
              onSave={handleSave}
              onClose={() => setFormItem(null)}
            />
          )}
          {deleteItem && (
            <DeleteModal
              title={ADMIN_UI.statusCatalog.deleteTitle}
              message={ADMIN_UI.statusCatalog.deleteMessage(deleteItem.label)}
              onConfirm={handleDelete}
              onClose={() => setDeleteItem(null)}
              loading={deleteLoading}
            />
          )}
        </Suspense>
      </div>
    </>
  );
}
