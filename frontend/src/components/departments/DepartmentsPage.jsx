import { lazy, Suspense, useState, useCallback } from 'react';
import { ADMIN_UI } from '../../constants/admin';
import { useDepartmentPage } from '../../hooks/useDepartmentPage';
import AdminCatalogBreadcrumb from '../admin/sections/AdminCatalogBreadcrumb';
import ExcelTaskMenu from '../admin/sections/ExcelTaskMenu';
import RegistryTableShell from '../admin/sections/RegistryTableShell';
import TablePagination from '../admin/sections/TablePagination';
import MobilePagination from '../shared/MobilePagination';
import FlashBanner from '../shared/FlashBanner';
import InlineErrorBanner from '../shared/InlineErrorBanner';
import DepartmentStatGrid from './DepartmentStatGrid';
import DepartmentTable from './DepartmentTable';
import DepartmentCardList from './mobile/DepartmentCardList';
import DepartmentFilterBar from './DepartmentFilterBar';

const DepartmentFormModal = lazy(() => import('./DepartmentFormModal'));
const DepartmentGroupManageModal = lazy(() => import('./DepartmentGroupManageModal'));
const DeleteModal = lazy(() => import('../shared/DeleteModal'));

export default function DepartmentsPage() {
  const [groupsModalOpen, setGroupsModalOpen] = useState(false);

  const {
    search,
    setSearch,
    groupFilter,
    setGroupFilter,
    resetFilters,
    groups,
    reloadGroups,
    showGroupColumn,
    defaultGroupCode,
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
    staffList,
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
  } = useDepartmentPage();

  const handleGroupsChanged = useCallback(() => {
    reloadGroups();
    reload();
  }, [reloadGroups, reload]);

  return (
    <>
      <AdminCatalogBreadcrumb currentLabelKey="departments" />

      <div className="flex flex-col lg:h-full lg:min-h-0 gap-2 lg:gap-2">
        {flash && <FlashBanner flash={flash} onClose={clearFlash} />}
        <InlineErrorBanner message={error} />

        <div className="shrink-0">
          <DepartmentStatGrid stats={stats} />
        </div>

        <RegistryTableShell
          toolbar={
            <DepartmentFilterBar
              groups={groups}
              groupFilter={groupFilter}
              onGroupFilterChange={setGroupFilter}
              onManageGroups={() => setGroupsModalOpen(true)}
              search={search}
              onSearchChange={setSearch}
              onAdd={() => setFormDept({})}
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
                  unitLabel="đơn vị"
                />
              </div>
              {!initialLoading && (
                <MobilePagination
                  sticky={false}
                  className="lg:hidden py-2"
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
            <DepartmentCardList
              items={paginated}
              showGroupName={showGroupColumn}
              onEdit={setFormDept}
              onDelete={setDeleteDept}
            />
          </div>
          <div className="hidden lg:block">
            <DepartmentTable
              items={paginated}
              showGroupColumn={showGroupColumn}
              onEdit={setFormDept}
              onDelete={setDeleteDept}
            />
          </div>
        </RegistryTableShell>

        <Suspense fallback={null}>
          {groupsModalOpen && (
            <DepartmentGroupManageModal
              onClose={() => setGroupsModalOpen(false)}
              onGroupsChanged={handleGroupsChanged}
            />
          )}
          {formDept && (
            <DepartmentFormModal
              initial={formDept.deptCode ? formDept : null}
              staffList={staffList}
              groups={groups}
              defaultGroupCode={defaultGroupCode}
              onSave={handleSave}
              onClose={() => setFormDept(null)}
            />
          )}
          {deleteDept && (
            <DeleteModal
              title={ADMIN_UI.departments.deleteTitle}
              message={ADMIN_UI.departments.deleteMessage(deleteDept.deptName)}
              onConfirm={handleDelete}
              onClose={() => setDeleteDept(null)}
              loading={deleteLoading}
            />
          )}
        </Suspense>
      </div>
    </>
  );
}
