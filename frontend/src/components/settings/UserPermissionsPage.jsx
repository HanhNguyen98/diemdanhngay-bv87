import { lazy, Suspense } from 'react';
import { ADMIN_UI } from '../../constants/admin';
import { useAccountsPage } from '../../hooks/useAccountsPage';
import AdminSubmenuBreadcrumb from '../admin/sections/AdminSubmenuBreadcrumb';
import RegistryTableShell from '../admin/sections/RegistryTableShell';
import TablePagination from '../admin/sections/TablePagination';
import FlashBanner from '../shared/FlashBanner';
import InlineErrorBanner from '../shared/InlineErrorBanner';
import AccountStatGrid from './AccountStatGrid';
import AccountTable from './AccountTable';
import AccountFilterBar from './AccountFilterBar';
import AccountMobileSection from './mobile/AccountMobileSection';

const AccountFormModal = lazy(() => import('./AccountFormModal'));
const DeleteModal = lazy(() => import('../shared/DeleteModal'));
const ResetPasswordModal = lazy(() => import('./ResetPasswordModal'));

export default function UserPermissionsPage() {
  const {
    departments,
    staffList,
    items,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    resetFilters,
    togglingId,
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
    formAccount,
    setFormAccount,
    deleteAccount,
    setDeleteAccount,
    deleteLoading,
    resetAccount,
    setResetAccount,
    handleResetPassword,
    handleSave,
    handleDelete,
    handleToggleActive,
    formAccounts,
    flash,
    clearFlash,
  } = useAccountsPage();

  const { accounts: a } = ADMIN_UI;

  return (
    <>
      <AdminSubmenuBreadcrumb parentLabelKey="settings" currentLabelKey="settingsUsers" />
      <div className="flex flex-col lg:h-full lg:min-h-0 gap-2">
        {flash && <FlashBanner flash={flash} onClose={clearFlash} />}
        <InlineErrorBanner message={error} />

        <div className="shrink-0">
          <AccountStatGrid stats={stats} />
        </div>

        <div className="shrink-0 lg:hidden">
          <AccountFilterBar
            search={search}
            onSearchChange={setSearch}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onAdd={() => setFormAccount({})}
            onResetFilters={resetFilters}
            loading={initialLoading}
          />
        </div>

        <AccountMobileSection
          totalCount={filteredCount}
          items={paginated}
          loading={loading}
          initialLoading={initialLoading}
          refreshing={refreshing}
          page={page}
          totalPages={totalPages}
          onPageChange={goToPage}
          onEdit={setFormAccount}
          onDelete={setDeleteAccount}
          onResetPassword={setResetAccount}
          onToggleActive={handleToggleActive}
          togglingId={togglingId}
        />

        <RegistryTableShell
          className="hidden lg:flex flex-1 min-h-0"
          toolbar={
            <AccountFilterBar
              search={search}
              onSearchChange={setSearch}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onAdd={() => setFormAccount({})}
              onResetFilters={resetFilters}
              loading={initialLoading}
            />
          }
          initialLoading={initialLoading}
          refreshing={refreshing}
          loadingLabel={ADMIN_UI.loading}
          footer={
            <TablePagination
              page={page}
              totalPages={totalPages}
              totalItems={filteredCount}
              pageSize={pageSize}
              onPageChange={goToPage}
              unitLabel="tài khoản"
            />
          }
        >
          <AccountTable
            items={paginated}
            onEdit={setFormAccount}
            onDelete={setDeleteAccount}
            onResetPassword={setResetAccount}
          />
        </RegistryTableShell>

        <Suspense fallback={null}>
          {formAccount && (
            <AccountFormModal
              initial={formAccount.id ? formAccount : null}
              departments={departments}
              staffList={staffList}
              accounts={formAccounts}
              onSave={handleSave}
              onClose={() => setFormAccount(null)}
            />
          )}
          {deleteAccount && (
            <DeleteModal
              title={a.deleteTitle}
              message={a.deleteMessage(deleteAccount.username)}
              onConfirm={handleDelete}
              onClose={() => setDeleteAccount(null)}
              loading={deleteLoading}
            />
          )}
          {resetAccount && (
            <ResetPasswordModal
              account={resetAccount}
              onConfirm={handleResetPassword}
              onClose={() => setResetAccount(null)}
            />
          )}
        </Suspense>
      </div>
    </>
  );
}
