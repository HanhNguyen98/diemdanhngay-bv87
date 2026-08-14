import { lazy, Suspense } from 'react';
import { ADMIN_UI, MOBILE_REGISTRY_PAGINATION_CLASS } from '../../constants/admin';
import { UI } from '../../constants/attendance';
import { useStaffPage } from '../../hooks/useStaffPage';
import { useHeadStaffPage } from '../../hooks/useHeadStaffPage';
import AdminCatalogBreadcrumb from '../admin/sections/AdminCatalogBreadcrumb';
import RegistryTableShell from '../admin/sections/RegistryTableShell';
import TablePagination from '../admin/sections/TablePagination';
import MobilePagination from '../shared/MobilePagination';
import ExcelTaskMenu from '../admin/sections/ExcelTaskMenu';
import StaffFilterBar from './StaffFilterBar';
import StaffStatGrid from './StaffStatGrid';
import StaffTable from './StaffTable';
import StaffCardList from './mobile/StaffCardList';
import FlashBanner from '../shared/FlashBanner';
import InlineErrorBanner from '../shared/InlineErrorBanner';

const StaffFormModal = lazy(() => import('./StaffFormModal'));
const StaffAvatarModal = lazy(() => import('./StaffAvatarModal'));
const StaffTransferHistoryModal = lazy(() => import('./StaffTransferHistoryModal'));
const StaffTransferModal = lazy(() => import('./StaffTransferModal'));
const DeleteModal = lazy(() => import('../shared/DeleteModal'));

function StaffRegistryView({
  isHead,
  search,
  setSearch,
  stats,
  loading,
  initialLoading,
  refreshing,
  error,
  listItems,
  showPagination = true,
  filteredCount,
  page,
  totalPages,
  pageSize,
  goToPage,
  departments,
  deptFilter,
  setDeptFilter,
  onResetFilters,
  formStaff,
  setFormStaff,
  deleteStaff,
  setDeleteStaff,
  deleteLoading,
  handleSave,
  handleDelete,
  importing,
  handleTemplateDownload,
  handleImportFile,
  handleExport,
  avatarStaff,
  setAvatarStaff,
  handleSaveAvatar,
  historyStaff,
  setHistoryStaff,
  transferStaff,
  setTransferStaff,
  handleTransfer,
  flash,
  clearFlash,
}) {
  return (
    <>
      {!isHead && <AdminCatalogBreadcrumb currentLabelKey="staff" />}

      <div className="flex flex-col gap-2 lg:h-full lg:min-h-0">

      {flash && <FlashBanner flash={flash} onClose={clearFlash} />}
      <InlineErrorBanner message={error} />

      <div className="shrink-0">
        <StaffStatGrid stats={stats} mobileCompact={isHead} />
      </div>

      <RegistryTableShell
        toolbar={
          <StaffFilterBar
            isHead={isHead}
            departments={departments}
            deptFilter={deptFilter}
            onDeptFilterChange={setDeptFilter}
            search={search}
            onSearchChange={setSearch}
            onAdd={() => setFormStaff({})}
            onResetFilters={onResetFilters}
            loading={initialLoading}
            excelControl={
              isHead ? null : (
                <ExcelTaskMenu
                  onTemplate={handleTemplateDownload}
                  onImport={handleImportFile}
                  onExport={handleExport}
                  importing={importing}
                  disabled={initialLoading}
                />
              )
            }
          />
        }
        initialLoading={initialLoading}
        refreshing={refreshing}
        loadingLabel={ADMIN_UI.loading}
        footer={
          showPagination ? (
            <>
              <div className="hidden lg:block">
                <TablePagination
                  page={page}
                  totalPages={totalPages}
                  totalItems={filteredCount}
                  pageSize={pageSize}
                  onPageChange={goToPage}
                  unitLabel={UI.employees}
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
          ) : null
        }
        className="lg:flex-1 lg:min-h-0"
      >
        <div className="lg:hidden">
          <StaffCardList
            items={listItems}
            avatarOnly={isHead}
            hideDeptColumn={isHead}
            onEdit={isHead ? setAvatarStaff : setFormStaff}
            onDelete={isHead ? undefined : setDeleteStaff}
            onHistory={isHead ? undefined : setHistoryStaff}
            onTransfer={isHead ? undefined : setTransferStaff}
          />
        </div>
        <div className="hidden lg:block">
          <StaffTable
            items={listItems}
            avatarOnly={isHead}
            hideDeptColumn={isHead}
            onEdit={isHead ? setAvatarStaff : setFormStaff}
            onDelete={isHead ? undefined : setDeleteStaff}
            onHistory={isHead ? undefined : setHistoryStaff}
            onTransfer={isHead ? undefined : setTransferStaff}
          />
        </div>
      </RegistryTableShell>

      <Suspense fallback={null}>
        {isHead && avatarStaff && (
          <StaffAvatarModal
            staff={avatarStaff}
            onSave={handleSaveAvatar}
            onClose={() => setAvatarStaff(null)}
          />
        )}
        {!isHead && formStaff && (
          <StaffFormModal
            initial={formStaff.empCode ? formStaff : null}
            departments={departments}
            onSave={handleSave}
            onClose={() => setFormStaff(null)}
          />
        )}
        {!isHead && deleteStaff && (
          <DeleteModal
            title={ADMIN_UI.staff.deleteTitle}
            message={ADMIN_UI.staff.deleteMessage(deleteStaff.fullname)}
            onConfirm={handleDelete}
            onClose={() => setDeleteStaff(null)}
            loading={deleteLoading}
          />
        )}
        {!isHead && historyStaff && (
          <StaffTransferHistoryModal
            staff={historyStaff}
            onClose={() => setHistoryStaff(null)}
          />
        )}
        {!isHead && transferStaff && (
          <StaffTransferModal
            staff={transferStaff}
            departments={departments}
            onSave={handleTransfer}
            onClose={() => setTransferStaff(null)}
          />
        )}
      </Suspense>
      </div>
    </>
  );
}

function AdminStaffContent() {
  const state = useStaffPage();
  return (
    <StaffRegistryView
      isHead={false}
      search={state.search}
      setSearch={state.setSearch}
      stats={state.stats}
      loading={state.loading}
      initialLoading={state.initialLoading}
      refreshing={state.refreshing}
      error={state.error}
      listItems={state.paginated}
      showPagination
      filteredCount={state.filteredCount}
      page={state.page}
      totalPages={state.totalPages}
      pageSize={state.pageSize}
      goToPage={state.goToPage}
      departments={state.departments}
      deptFilter={state.deptFilter}
      setDeptFilter={state.setDeptFilter}
      onResetFilters={state.resetFilters}
      formStaff={state.formStaff}
      setFormStaff={state.setFormStaff}
      deleteStaff={state.deleteStaff}
      setDeleteStaff={state.setDeleteStaff}
      historyStaff={state.historyStaff}
      setHistoryStaff={state.setHistoryStaff}
      transferStaff={state.transferStaff}
      setTransferStaff={state.setTransferStaff}
      deleteLoading={state.deleteLoading}
      handleSave={state.handleSave}
      handleTransfer={state.handleTransfer}
      handleDelete={state.handleDelete}
      importing={state.importing}
      handleTemplateDownload={state.handleTemplateDownload}
      handleImportFile={state.handleImportFile}
      handleExport={state.handleExport}
      flash={state.flash}
      clearFlash={state.clearFlash}
    />
  );
}

function HeadStaffContent() {
  const state = useHeadStaffPage();
  return (
    <StaffRegistryView
      isHead
      search={state.search}
      setSearch={state.setSearch}
      onResetFilters={state.resetFilters}
      stats={state.stats}
      loading={state.loading}
      initialLoading={state.initialLoading}
      refreshing={state.refreshing}
      error={state.error}
      listItems={state.paginated}
      showPagination
      filteredCount={state.filteredCount}
      page={state.page}
      totalPages={state.totalPages}
      pageSize={state.pageSize}
      goToPage={state.goToPage}
      avatarStaff={state.avatarStaff}
      setAvatarStaff={state.setAvatarStaff}
      handleSaveAvatar={state.handleSaveAvatar}
      flash={state.flash}
      clearFlash={state.clearFlash}
    />
  );
}

export default function StaffPage({ mode = 'admin' }) {
  return mode === 'head' ? <HeadStaffContent /> : <AdminStaffContent />;
}
