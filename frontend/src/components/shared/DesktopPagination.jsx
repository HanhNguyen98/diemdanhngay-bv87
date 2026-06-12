import { memo, useMemo } from 'react';
import { IconChevronLeft, IconChevronRight } from '../icons/Icons';
import { ADMIN_UI } from '../../constants/admin';
import { buildPageRange } from '../../hooks/usePagination';

const NAV_BTN =
  'w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-content-muted disabled:opacity-40 hover:bg-neutral transition-colors';

const DesktopPagination = memo(function DesktopPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  summaryMode = 'range',
  embedded = false,
  unitLabel = 'nhân viên',
  formatShowing,
  useEllipsis = false,
}) {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const countOnPage = end - start + 1;

  const pages = useMemo(() => {
    if (useEllipsis) return buildPageRange(page, totalPages);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [page, totalPages, useEllipsis]);

  const summaryText = formatShowing
    ? formatShowing(start, end, totalItems)
    : summaryMode === 'count'
      ? `Hiển thị ${countOnPage} trong số ${totalItems} ${unitLabel}`
      : unitLabel === 'nhân viên'
        ? `Hiển thị ${start} - ${end} của ${totalItems} nhân viên`
        : `${ADMIN_UI.showing(start, end, totalItems)}${unitLabel ? ` ${unitLabel}` : ''}`;

  const wrapperClass = embedded
    ? 'shrink-0 px-4 py-2 border-t border-slate-200 bg-table-header flex flex-wrap items-center justify-end gap-2'
    : 'flex flex-wrap items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-200';

  return (
    <div className={wrapperClass}>
      <p className="text-xs text-content-muted">{summaryText}</p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={NAV_BTN}
          aria-label="Trang trước"
        >
          <IconChevronLeft className="w-3.5 h-3.5" />
        </button>
        {pages.map((p, idx) =>
          p === '…' ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-7 h-7 flex items-center justify-center text-content-muted text-xs"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={
                p === page
                  ? 'w-7 h-7 rounded-md text-xs font-medium bg-pagination-active text-white'
                  : 'w-7 h-7 rounded-md text-xs font-medium border border-slate-200 text-content-muted hover:bg-neutral transition-colors'
              }
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={NAV_BTN}
          aria-label="Trang sau"
        >
          <IconChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

export default DesktopPagination;
