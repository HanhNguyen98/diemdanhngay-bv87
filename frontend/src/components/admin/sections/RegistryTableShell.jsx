import { memo } from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';
import RefreshOverlay from '../../shared/RefreshOverlay';

function RegistryTableSkeleton({ rows = 7 }) {
  return (
    <div className="flex-1 min-h-0 overflow-hidden px-3 lg:px-4 py-3" aria-hidden="true">
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="h-4 flex-1 rounded-md bg-neutral/60 animate-pulse" />
            <div className="h-4 w-16 rounded-md bg-neutral/40 animate-pulse hidden sm:block" />
            <div className="h-4 w-12 rounded-md bg-neutral/40 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

const RegistryTableShell = memo(function RegistryTableShell({
  title,
  actionLabel,
  onAction,
  filterControl,
  filterLabel,
  searchControl,
  excelControl,
  toolbar,
  loading,
  initialLoading: initialLoadingProp,
  refreshing: refreshingProp,
  loadingLabel,
  children,
  footer,
  className = '',
  skeletonRows = 7,
}) {
  const initialLoading = initialLoadingProp ?? loading;
  const refreshing = refreshingProp ?? false;

  return (
    <div
      className={`bg-surface-white border border-line rounded-xl shadow-card overflow-hidden flex flex-col flex-1 min-h-0 ${className}`}
    >
      <div
        className={`shrink-0 px-3 lg:px-4 py-2 border-b border-line min-w-0 ${
          title ? 'flex flex-col gap-2' : ''
        }`}
      >
        {title && <h2 className="admin-section-title">{title}</h2>}
        {toolbar ? (
          <div className="w-full min-w-0">{toolbar}</div>
        ) : (
          <div className="flex flex-col gap-2 w-full lg:flex-row lg:flex-nowrap lg:items-center lg:justify-end lg:gap-1.5 min-w-0">
            {(actionLabel && onAction) || excelControl ? (
              <div className="flex items-center gap-2 w-full lg:contents">
                {actionLabel && onAction && (
                  <button
                    type="button"
                    onClick={onAction}
                    className="inline-flex items-center justify-center gap-1.5 h-8 btn-primary px-2.5 rounded-lg text-sm shadow-sm flex-1 min-w-0 lg:flex-initial"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    {actionLabel}
                  </button>
                )}
                {excelControl && <div className="shrink-0">{excelControl}</div>}
              </div>
            ) : null}
            {filterControl ??
              (filterLabel && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-line text-sm text-content-muted hover:bg-neutral transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {filterLabel}
                </button>
              ))}
            {searchControl}
          </div>
        )}
      </div>

      {initialLoading ? (
        <RegistryTableSkeleton rows={skeletonRows} />
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="relative flex-1 min-h-0 overflow-auto">
            {refreshing && <RefreshOverlay />}
            {children}
          </div>
          {footer}
        </div>
      )}

      {(initialLoading || refreshing) && loadingLabel ? (
        <p className="sr-only">{loadingLabel}</p>
      ) : null}
    </div>
  );
});

export default RegistryTableShell;
