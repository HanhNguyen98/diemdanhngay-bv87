import { lazy, Suspense } from 'react';
import { ADMIN_UI } from '../../constants/admin';
import { UI } from '../../constants/attendance';
import { useStaffPage } from '../../hooks/useStaffPage';
import { useHeadStaffPage } from '../../hooks/useHeadStaffPage';
import RegistryTableShell from '../admin/sections/RegistryTableShell';
import TablePagination from '../admin/sections/TablePagination';
import MobilePagination from '../shared/MobilePagination';
import StaffDeptFilter from './StaffDeptFilter';
import RegistrySearchInput from '../admin/sections/RegistrySearchInput';
import ExcelTaskMenu from '../admin/sections/ExcelTaskMenu';
import StaffStatGrid from './StaffStatGrid';
import StaffTable from './StaffTable';
import StaffViewModal from './StaffViewModal';
import FlashBanner from '../shared/FlashBanner';
import InlineErrorBanner from '../shared/InlineErrorBanner';

const StaffFormModal = lazy(() => import('./StaffFormModal'));
const StaffAvatarModal = lazy(() => import('./StaffAvatarModal'));
const DeleteModal = lazy(() => import('../shared/DeleteModal'));

function StaffRegistryView({
  isHead,
  search,
  setSearch,
  stats,
  loading,
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
  viewStaff,
  setViewStaff,
  flash,
  clearFlash,
}) {
  return (
    <div className="flex flex-col gap-2 lg:h-full lg:min-h-0">
      {flash && <FlashBanner flash={flash} onClose={clearFlash} />}
      <InlineErrorBanner message={error} />

      <div className="shrink-0">
        <StaffStatGrid stats={stats} mobileCompact={isHead} />
      </div>

      <RegistryTableShell
        actionLabel={isHead ? null : ADMIN_UI.staff.newButton}
        onAction={isHead ? null : () => setFormStaff({})}
        filterControl={
          isHead ? null : (
            <StaffDeptFilter
              departments={departments}
              value={deptFilter}
              onChange={setDeptFilter}
            />
          )
        }
        searchControl={
          <RegistrySearchInput
            value={search}
            onChange={setSearch}
            placeholder={ADMIN_UI.searchPlaceholderStaff}
            widthClass="w-full sm:w-[340px] max-w-full"
          />
        }
        excelControl={
          isHead ? null : (
            <ExcelTaskMenu
              onTemplate={handleTemplateDownload}
              onImport={handleImportFile}
              onExport={handleExport}
              importing={importing}
              disabled={loading}
            />
          )
        }
        loading={loading}
        loadingLabel={ADMIN_UI.loading}
        footer={
          showPagination ? (
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
          ) : null
        }
        className="lg:flex-1 lg:min-h-0"
      >
        <StaffTable
          items={listItems}
          avatarOnly={isHead}
          onView={setViewStaff}
          onEdit={isHead ? setAvatarStaff : setFormStaff}
          onDelete={isHead ? undefined : setDeleteStaff}
        />
      </RegistryTableShell>

      {showPagination && !loading && (
        <MobilePagination
          className="lg:hidden shrink-0"
          page={page}
          totalPages={totalPages}
          totalItems={filteredCount}
          onPageChange={goToPage}
        />
      )}

      <StaffViewModal staff={viewStaff} onClose={() => setViewStaff(null)} />

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
      </Suspense>
    </div>
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
      formStaff={state.formStaff}
      setFormStaff={state.setFormStaff}
      deleteStaff={state.deleteStaff}
      setDeleteStaff={state.setDeleteStaff}
      deleteLoading={state.deleteLoading}
      handleSave={state.handleSave}
      handleDelete={state.handleDelete}
      importing={state.importing}
      handleTemplateDownload={state.handleTemplateDownload}
      handleImportFile={state.handleImportFile}
      handleExport={state.handleExport}
      viewStaff={state.viewStaff}
      setViewStaff={state.setViewStaff}
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
      stats={state.stats}
      loading={state.loading}
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
      viewStaff={state.viewStaff}
      setViewStaff={state.setViewStaff}
      flash={state.flash}
      clearFlash={state.clearFlash}
    />
  );
}

export default function StaffPage({ mode = 'admin' }) {
  return mode === 'head' ? <HeadStaffContent /> : <AdminStaffContent />;
}
