import { memo } from 'react';
import { Filter } from 'lucide-react';
import { ADMIN_UI } from '../../../../constants/admin';

const DATE_INPUT_CLASS =
  'h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus-visible:ring-2 focus-visible:ring-primary/25 min-w-[140px]';

const LABEL_CLASS =
  'text-2xs font-semibold text-content-muted uppercase tracking-wider shrink-0';

const ReminderHistoryFilterBar = memo(function ReminderHistoryFilterBar({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApply,
  loading,
}) {
  const { dashboard: d } = ADMIN_UI;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 w-full">
      <label className="flex items-center gap-2">
        <span className={LABEL_CLASS}>{d.reminderFilterFrom}</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className={DATE_INPUT_CLASS}
        />
      </label>

      <label className="flex items-center gap-2">
        <span className={LABEL_CLASS}>{d.reminderFilterTo}</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className={DATE_INPUT_CLASS}
        />
      </label>

      <button
        type="button"
        onClick={onApply}
        disabled={loading}
        className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60 ml-auto"
      >
        <Filter className="w-4 h-4" />
        {d.reminderApplyFilter}
      </button>
    </div>
  );
});

export default ReminderHistoryFilterBar;
