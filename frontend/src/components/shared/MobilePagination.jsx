import { memo, useMemo } from 'react';
import { IconChevronLeft, IconChevronRight } from '../icons/Icons';
import { buildPageRange } from '../../hooks/usePagination';

const BTN_BASE = 'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors';

const NAV_BTN = `${BTN_BASE} border bg-surface-white border-line text-navy hover:bg-primary-light disabled:bg-attendance-search disabled:border-line/50 disabled:text-content-muted/40 disabled:hover:bg-attendance-search`;

const PAGE_BTN = `${BTN_BASE} text-sm`;

const STICKY_BAR =
  'sticky bottom-0 z-30 mt-1 py-1.5 bg-surface-page/90 backdrop-blur-sm border-t border-line/80';

const MobilePagination = memo(function MobilePagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
  className = '',
  sticky = true,
}) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const pages = useMemo(() => buildPageRange(page, safeTotalPages), [page, safeTotalPages]);

  if (!totalItems) return null;

  return (
    <nav
      className={`flex items-center justify-center gap-2 ${sticky ? STICKY_BAR : 'py-2'} ${className}`}
      aria-label="Phân trang"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={NAV_BTN}
        aria-label="Trang trước"
      >
        <IconChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p, idx) =>
        p === '…' ? (
          <span
            key={`ellipsis-${idx}`}
            className="w-10 h-10 flex items-center justify-center text-content-muted text-sm leading-none"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={
              p === page
                ? `${PAGE_BTN} bg-primary text-white font-bold`
                : `${PAGE_BTN} bg-table-header text-gray-800 font-medium hover:bg-primary-light`
            }
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= safeTotalPages}
        className={NAV_BTN}
        aria-label="Trang sau"
      >
        <IconChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
});

export default MobilePagination;
