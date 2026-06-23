import { memo } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';
import { STATISTICS_UI } from '../../../constants/attendance';

const RESET_BTN_CLASS =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-white text-content-muted hover:bg-neutral transition-colors disabled:opacity-60';

const APPLY_BTN_CLASS =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-60';

/** Mobile admin — nút áp dụng bộ lọc (icon only; Reset tuỳ chọn). */
const MobileFilterApplyRow = memo(function MobileFilterApplyRow({
  onApply,
  onReset,
  disabled = false,
  applyLabel = STATISTICS_UI.applyFilter,
  resetLabel = ADMIN_UI.resetFilters,
  className = '',
}) {
  return (
    <div className={`flex items-center gap-2 shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => onApply?.()}
        disabled={disabled}
        className={APPLY_BTN_CLASS}
        title={applyLabel}
        aria-label={applyLabel}
      >
        <Search className="w-4 h-4" aria-hidden="true" />
      </button>
      {onReset && (
        <button
          type="button"
          onClick={() => onReset?.()}
          disabled={disabled}
          title={resetLabel}
          aria-label={resetLabel}
          className={RESET_BTN_CLASS}
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
});

export default MobileFilterApplyRow;
