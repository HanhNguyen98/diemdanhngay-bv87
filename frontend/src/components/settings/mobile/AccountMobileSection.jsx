import { memo } from 'react';
import { ADMIN_UI, MOBILE_REGISTRY_PAGINATION_CLASS } from '../../../constants/admin';
import MobilePagination from '../../shared/MobilePagination';
import AccountCardList from './AccountCardList';

const LIST_SHELL =
  'bg-surface-white border border-gray-200 rounded-xl shadow-card overflow-hidden';

const AccountMobileSection = memo(function AccountMobileSection({
  totalCount,
  items,
  loading,
  initialLoading: initialLoadingProp,
  refreshing = false,
  page,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  onResetPassword,
  onToggleActive,
  togglingId,
}) {
  const { mobile: m } = ADMIN_UI.accounts;
  const initialLoading = initialLoadingProp ?? loading;

  return (
    <div className="lg:hidden">
      <section className={LIST_SHELL}>
        <div className="px-3 py-2.5 border-b border-line">
          <h3 className="text-xs font-bold text-content-muted uppercase tracking-wide">
            {m.listTitle(totalCount)}
          </h3>
        </div>

        {initialLoading ? (
          <div className="py-20 text-center text-content-muted animate-pulse">{ADMIN_UI.loading}</div>
        ) : (
          <div className="relative">
            {refreshing && (
              <div
                className="absolute inset-0 z-10 bg-surface-white/40 pointer-events-none"
                aria-hidden="true"
              />
            )}
            <AccountCardList
              items={items}
              onEdit={onEdit}
              onDelete={onDelete}
              onResetPassword={onResetPassword}
              onToggleActive={onToggleActive}
              togglingId={togglingId}
            />
            <MobilePagination
              sticky={false}
              className={MOBILE_REGISTRY_PAGINATION_CLASS}
              page={page}
              totalPages={totalPages}
              totalItems={totalCount}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </section>
    </div>
  );
});

export default AccountMobileSection;
