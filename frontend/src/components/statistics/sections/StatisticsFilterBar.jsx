import { RotateCcw, Search } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';
import { STATISTICS_UI, TIME_RANGE_PRESETS } from '../../../constants/attendance';
import TextSearchInput from '../../shared/TextSearchInput';
import DateRangePickerField from '../../ui/DateRangePickerField';

const DATE_INPUT_CLASS =
  'h-9 shrink-0 rounded-lg border border-line bg-surface-white px-3 text-sm text-content-body outline-none focus-visible:ring-2 focus-visible:ring-primary/25 w-[8.75rem]';

const DATE_RANGE_WIDTH_CLASS = 'shrink-0 w-[14.75rem] lg:w-[15.5rem]';

const SEARCH_WIDTH_CLASS = 'shrink-0 w-[13rem] lg:w-[15rem]';

const RESET_BTN_CLASS =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-white text-content-muted hover:bg-neutral transition-colors disabled:opacity-60';

export default function StatisticsFilterBar({
  timePreset,
  onTimePresetChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  search,
  onSearchChange,
  onApply,
  onReset,
  loading,
}) {
  return (
    <section
      className="shrink-0 bg-surface-white border border-line rounded-xl px-4 py-3 shadow-card overflow-hidden"
      aria-label={STATISTICS_UI.timeRangeLabel}
    >
      <div className="flex flex-nowrap items-center gap-2 min-w-0 w-full">
        <select
          value={timePreset}
          onChange={(e) => onTimePresetChange(e.target.value)}
          className={DATE_INPUT_CLASS}
          aria-label={STATISTICS_UI.timeRangeLabel}
          disabled={loading}
        >
          {TIME_RANGE_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        <DateRangePickerField
          dateFrom={dateFrom}
          dateTo={dateTo}
          onRangeChange={(from, to) => {
            onDateFromChange(from);
            onDateToChange(to);
          }}
          disabled={loading}
          ariaLabel={STATISTICS_UI.timeRangeLabel}
          className={DATE_RANGE_WIDTH_CLASS}
        />

        <div className={SEARCH_WIDTH_CLASS}>
          <TextSearchInput
            value={search}
            onChange={onSearchChange}
            placeholder={STATISTICS_UI.searchPlaceholder}
            widthClass="w-full"
            inputClassName="h-9 w-full min-w-0 pl-3 rounded-lg border border-line text-sm text-content-body bg-surface-white hover:bg-neutral outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-colors"
            showSearchIcon={false}
          />
        </div>

        <button
          type="button"
          onClick={onApply}
          disabled={loading}
          className="h-9 shrink-0 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60"
        >
          <Search className="w-4 h-4" aria-hidden="true" />
          {STATISTICS_UI.applyFilter}
        </button>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            disabled={loading}
            title={ADMIN_UI.resetFilters}
            aria-label={ADMIN_UI.resetFilters}
            className={RESET_BTN_CLASS}
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
