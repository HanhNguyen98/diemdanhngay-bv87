import { memo } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { ADMIN_UI } from '../../../../constants/admin';
import StaffDeptFilter from '../../../staff/StaffDeptFilter';
import DateRangePickerField from '../../../ui/DateRangePickerField';

const LABEL_CLASS =
  'text-3xs font-semibold text-content-muted uppercase shrink-0 whitespace-nowrap';

const APPLY_BTN_CLASS =
  'h-9 shrink-0 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60';

const RESET_BTN_CLASS =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-white text-content-muted hover:bg-neutral transition-colors disabled:opacity-60';

const ReminderHistoryFilterBar = memo(function ReminderHistoryFilterBar({
  departments,
  deptFilter,
  onDeptFilterChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApply,
  onReset,
  loading,
  layout = 'desktop-toolbar',
  rangeLabel,
}) {
  const { dashboard: d } = ADMIN_UI;
  const rangeText = rangeLabel || d.reminderFilterRange;

  const applyButton = (
    <button
      type="button"
      onClick={() => onApply?.()}
      disabled={loading}
      className={APPLY_BTN_CLASS}
      aria-label={d.reminderApplyFilter}
    >
      <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
      {layout === 'desktop-toolbar' ? (
        d.reminderApplyFilter
      ) : (
        <span className="hidden sm:inline">{d.reminderApplyFilter}</span>
      )}
    </button>
  );

  const resetButton = onReset ? (
    <button
      type="button"
      onClick={() => onReset?.()}
      disabled={loading}
      title={ADMIN_UI.resetFilters}
      aria-label={ADMIN_UI.resetFilters}
      className={RESET_BTN_CLASS}
    >
      <RotateCcw className="w-4 h-4" aria-hidden="true" />
    </button>
  ) : null;

  if (layout === 'mobile-row') {
    return (
      <div className="flex items-center gap-2 w-full min-w-0">
        <DateRangePickerField
          dateFrom={dateFrom}
          dateTo={dateTo}
          onRangeChange={(from, to) => {
            onDateFromChange(from);
            onDateToChange(to);
          }}
          disabled={loading}
          ariaLabel={rangeText}
          className="flex-1 min-w-0"
        />
        {applyButton}
        {resetButton}
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center gap-2 min-w-0 flex-wrap lg:flex-nowrap">
      <StaffDeptFilter
        departments={departments}
        value={deptFilter}
        onChange={onDeptFilterChange}
        className="w-full sm:w-[15rem] shrink-0"
      />

      <div className="flex items-center gap-2 shrink-0 min-w-0">
        <span className={LABEL_CLASS}>{rangeText}</span>
        <DateRangePickerField
          dateFrom={dateFrom}
          dateTo={dateTo}
          onRangeChange={(from, to) => {
            onDateFromChange(from);
            onDateToChange(to);
          }}
          disabled={loading}
          ariaLabel={rangeText}
          className="w-auto shrink-0"
          triggerClassName="min-w-[220px]"
        />
      </div>

      {applyButton}
      {resetButton}
    </div>
  );
});

export default ReminderHistoryFilterBar;
