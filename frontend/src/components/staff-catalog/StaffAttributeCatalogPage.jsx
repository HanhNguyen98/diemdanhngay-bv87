import { lazy, Suspense } from 'react';
import { ADMIN_UI, MOBILE_REGISTRY_PAGINATION_CLASS } from '../../constants/admin';
import { useStaffAttributeCatalogPage } from '../../hooks/useStaffAttributeCatalogPage';
import AdminCatalogBreadcrumb from '../admin/sections/AdminCatalogBreadcrumb';
import RegistryTableShell from '../admin/sections/RegistryTableShell';
import TablePagination from '../admin/sections/TablePagination';
import MobilePagination from '../shared/MobilePagination';
import FlashBanner from '../shared/FlashBanner';
import InlineErrorBanner from '../shared/InlineErrorBanner';
import ExcelTaskMenu from '../admin/sections/ExcelTaskMenu';
import StaffAttributeCatalogFilterBar from './StaffAttributeCatalogFilterBar';
import StaffAttributeCatalogStatGrid from './StaffAttributeCatalogStatGrid';
import StaffAttributeCatalogTable from './StaffAttributeCatalogTable';
import StaffAttributeCatalogCardList from './StaffAttributeCatalogCardList';

const StaffAttributeCatalogFormModal = lazy(() => import('./StaffAttributeCatalogFormModal'));
const DeleteModal = lazy(() => import('../shared/DeleteModal'));

export default function StaffAttributeCatalogPage({ config }) {
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
    handleToggleActive,
    importing,
    handleTemplateDownload,
    handleImportFile,
    handleExport,
    flash,
    clearFlash,
  } = useStaffAttributeCatalogPage(config);

  const ui = config.ui();
  const deleteName = deleteItem?.[config.nameField];

  return (
    <>
      <AdminCatalogBreadcrumb currentLabelKey={config.breadcrumbKey} />

      <div className="flex flex-col gap-2 lg:h-full lg:min-h-0">
        {flash && <FlashBanner flash={flash} onClose={clearFlash} />}
        <InlineErrorBanner message={error} />

        <div className="shrink-0">
          <StaffAttributeCatalogStatGrid config={config} stats={stats} />
        </div>

        <RegistryTableShell
          toolbar={
            <StaffAttributeCatalogFilterBar
              config={config}
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
                  unitLabel={ui.unitLabel}
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
            <StaffAttributeCatalogCardList
              items={paginated}
              config={config}
              onEdit={setFormItem}
              onDelete={setDeleteItem}
              onToggleActive={handleToggleActive}
            />
          </div>

          <div className="hidden lg:block">
            <StaffAttributeCatalogTable
              items={paginated}
              config={config}
              onEdit={setFormItem}
              onDelete={setDeleteItem}
            />
          </div>
        </RegistryTableShell>

        <Suspense fallback={null}>
          {formItem && (
            <StaffAttributeCatalogFormModal
              config={config}
              initial={formItem[config.codeField] ? formItem : null}
              onSave={handleSave}
              onClose={() => setFormItem(null)}
            />
          )}
          {deleteItem && (
            <DeleteModal
              title={ui.deleteTitle}
              message={ui.deleteMessage(deleteName)}
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
