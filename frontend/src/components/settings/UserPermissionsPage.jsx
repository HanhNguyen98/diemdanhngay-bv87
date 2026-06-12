import { lazy, Suspense } from 'react';
import { ADMIN_UI } from '../../constants/admin';
import { useAccountsPage } from '../../hooks/useAccountsPage';
import RegistryTableShell from '../admin/sections/RegistryTableShell';
import RegistrySearchInput from '../admin/sections/RegistrySearchInput';
import TablePagination from '../admin/sections/TablePagination';
import FlashBanner from '../shared/FlashBanner';
import InlineErrorBanner from '../shared/InlineErrorBanner';
import AccountStatGrid from './AccountStatGrid';
import AccountTable from './AccountTable';

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
    stats,
    loading,
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
    flash,
    clearFlash,
  } = useAccountsPage();

  return (
    <>
      <div className="flex flex-col h-full min-h-0 gap-2">
        {flash && <FlashBanner flash={flash} onClose={clearFlash} />}
        <InlineErrorBanner message={error} />

        <div className="shrink-0">
          <AccountStatGrid stats={stats} />
        </div>

        <RegistryTableShell
          actionLabel={ADMIN_UI.accounts.newButton}
          onAction={() => setFormAccount({})}
          searchControl={
            <RegistrySearchInput
              value={search}
              onChange={setSearch}
              placeholder={ADMIN_UI.accounts.searchPlaceholder}
              widthClass="w-full sm:w-[340px]"
            />
          }
          loading={loading}
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
              accounts={items}
              onSave={handleSave}
              onClose={() => setFormAccount(null)}
            />
          )}
          {deleteAccount && (
            <DeleteModal
              title={ADMIN_UI.accounts.deleteTitle}
              message={ADMIN_UI.accounts.deleteMessage(deleteAccount.username)}
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
