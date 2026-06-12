import { Filter } from 'lucide-react';
import { STATISTICS_UI, TIME_RANGE_PRESETS } from '../../../constants/attendance';
import TextSearchInput from '../../shared/TextSearchInput';

const DATE_INPUT_CLASS =
  'h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus-visible:ring-2 focus-visible:ring-primary/25 min-w-[140px]';

export default function StatisticsFilterBar({
  timePreset,
  onTimePresetChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  deptName,
  search,
  onSearchChange,
  onApply,
  loading,
}) {
  return (
    <section className="shrink-0 bg-surface-white border border-line rounded-xl px-4 py-3 shadow-card">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:flex-wrap">
        <div className="flex flex-col gap-1.5">
          <span className="text-2xs font-semibold text-content-muted uppercase tracking-wider">
            {STATISTICS_UI.timeRangeLabel}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={timePreset}
              onChange={(e) => onTimePresetChange(e.target.value)}
              className={`${DATE_INPUT_CLASS} min-w-[130px]`}
              aria-label={STATISTICS_UI.timeRangeLabel}
            >
              {TIME_RANGE_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className={DATE_INPUT_CLASS}
              aria-label={STATISTICS_UI.dateFromLabel}
            />
            <span className="text-content-muted text-sm select-none">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className={DATE_INPUT_CLASS}
              aria-label={STATISTICS_UI.dateToLabel}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 min-w-[200px]">
      
          <input
            type="text"
            value={deptName}
            readOnly
            disabled
            className="h-9 rounded-lg border border-gray-200 bg-neutral px-3 text-sm text-content-muted cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-2xs font-semibold text-content-muted uppercase tracking-wider">
            &nbsp;
          </label>
          <TextSearchInput
            value={search}
            onChange={onSearchChange}
            placeholder={STATISTICS_UI.searchPlaceholder}
            widthClass="w-full"
            inputClassName="h-9 pl-9 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white hover:bg-neutral outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={onApply}
          disabled={loading}
          className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Filter className="w-4 h-4" />
          {STATISTICS_UI.applyFilter}
        </button>
      </div>
    </section>
  );
}
