import { memo, useMemo } from 'react';
import { IconChevronLeft, IconChevronRight } from '../icons/Icons';
import { buildPageRange } from '../../hooks/usePagination';

const NAV_BTN =
  'w-9 h-9 rounded-lg bg-[#E6EEFE] flex items-center justify-center text-navy disabled:opacity-40 hover:bg-[#D9E4FC] transition-colors shrink-0';

const MobilePagination = memo(function MobilePagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
  className = '',
}) {
  const pages = useMemo(() => buildPageRange(page, totalPages), [page, totalPages]);

  if (!totalItems || totalPages <= 1) return null;

  return (
    <nav
      className={`flex items-center justify-center gap-3 py-4 ${className}`}
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

      <div className="flex items-center gap-2">
        {pages.map((p, idx) =>
          p === '…' ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-9 h-9 flex items-center justify-center text-content-muted text-sm"
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
                  ? 'w-9 h-9 rounded-lg bg-pagination-active text-white text-sm font-semibold shrink-0'
                  : 'w-9 h-9 flex items-center justify-center text-sm font-medium text-content-heading hover:text-primary transition-colors shrink-0'
              }
            >
              {p}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={NAV_BTN}
        aria-label="Trang sau"
      >
        <IconChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
});

export default MobilePagination;
