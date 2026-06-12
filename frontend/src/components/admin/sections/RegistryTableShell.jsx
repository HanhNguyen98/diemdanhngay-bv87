import { memo } from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';

const RegistryTableShell = memo(function RegistryTableShell({
  title,
  actionLabel,
  onAction,
  filterControl,
  filterLabel,
  searchControl,
  excelControl,
  loading,
  loadingLabel,
  children,
  footer,
  className = '',
}) {
  return (
    <div
      className={`bg-surface-white border border-gray-200 rounded-xl shadow-card overflow-hidden flex flex-col flex-1 min-h-0 ${className}`}
    >
      <div className="shrink-0 px-3 lg:px-4 py-2 border-b border-gray-200 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {title && <h2 className="text-sm font-bold text-gray-800">{title}</h2>}
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-1.5">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-1.5 h-8 btn-primary px-2.5 rounded-lg text-sm shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {actionLabel}
            </button>
          )}
          {filterControl ?? (
            filterLabel && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-gray-200 text-sm text-content-muted hover:bg-neutral transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {filterLabel}
              </button>
            )
          )}
          {searchControl}
          {excelControl}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20 text-content-muted animate-pulse">
          {loadingLabel}
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-auto">{children}</div>
          {footer}
        </div>
      )}
    </div>
  );
});

export default RegistryTableShell;
