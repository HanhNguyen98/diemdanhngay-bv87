import { memo } from 'react';
import { Plus } from 'lucide-react';
import { ADMIN_UI, MOBILE_REGISTRY_PAGINATION_CLASS } from '../../../constants/admin';
import MobilePagination from '../../shared/MobilePagination';
import KioskTokenCardList from './KioskTokenCardList';

const LIST_SHELL =
  'bg-surface-white border border-line rounded-xl shadow-card overflow-hidden';

const t = ADMIN_UI.fingerprintTokens;
const m = t.mobile;

const KioskTokenMobileSection = memo(function KioskTokenMobileSection({
  totalCount,
  items,
  loading,
  initialLoading: initialLoadingProp,
  refreshing = false,
  page,
  totalPages,
  onPageChange,
  busyId,
  copiedKey,
  onCopy,
  onIssue,
  onRenameLabel,
  onSetPin,
  onRotate,
  onRevoke,
}) {
  const initialLoading = initialLoadingProp ?? loading;

  return (
    <div className="lg:hidden">
      <section className={LIST_SHELL}>
        <div className="px-3 py-2.5 border-b border-line flex items-center justify-between gap-2 min-w-0">
          <h3 className="text-xs font-bold text-content-muted uppercase tracking-wide truncate min-w-0">
            {m.listTitle(totalCount)}
          </h3>
          <button
            type="button"
            onClick={onIssue}
            className="inline-flex items-center justify-center gap-1 h-8 btn-primary px-2.5 rounded-lg text-xs shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" aria-hidden />
            <span className="whitespace-nowrap">{t.issue}</span>
          </button>
        </div>

        {initialLoading ? (
          <div className="py-20 text-center text-content-muted animate-pulse">{t.loading}</div>
        ) : (
          <div className="relative">
            {refreshing && (
              <div
                className="absolute inset-0 z-10 bg-surface-white/40 pointer-events-none"
                aria-hidden="true"
              />
            )}
            <KioskTokenCardList
              items={items}
              busyId={busyId}
              copiedKey={copiedKey}
              onCopy={onCopy}
              onRenameLabel={onRenameLabel}
              onSetPin={onSetPin}
              onRotate={onRotate}
              onRevoke={onRevoke}
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

export default KioskTokenMobileSection;
