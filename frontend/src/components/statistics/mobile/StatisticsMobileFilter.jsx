import { memo, useState } from 'react';
import { Filter } from 'lucide-react';
import {
  MOBILE_STATISTICS_PRESETS,
  STATISTICS_UI,
  UI,
} from '../../../constants/attendance';
import TextSearchInput from '../../shared/TextSearchInput';

const DATE_INPUT_CLASS =
  'h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus-visible:ring-2 focus-visible:ring-primary/25';

const pillActive = 'bg-primary text-white font-semibold shadow-sm';
const pillInactive = 'bg-neutral text-content-body hover:bg-gray-200';

const StatisticsMobileFilter = memo(function StatisticsMobileFilter({
  timePreset,
  onPresetChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  search,
  onSearchChange,
  onApplySearch,
  loading,
}) {
  const [showFilter, setShowFilter] = useState(false);

  return (
    <section className="lg:hidden shrink-0 space-y-3 min-w-0" aria-label={STATISTICS_UI.timeRangeLabel}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xs font-semibold text-content-muted uppercase tracking-wider">
          {STATISTICS_UI.timeRangeLabel}
        </span>
        <button
          type="button"
          onClick={() => setShowFilter((v) => !v)}
          aria-expanded={showFilter}
          className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-sm font-medium transition-colors shrink-0 ${
            showFilter
              ? 'border-primary/30 bg-blue-50 text-primary'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50 bg-white'
          }`}
        >
          <Filter className="w-3.5 h-3.5" aria-hidden="true" />
          {UI.filterButton}
        </button>
      </div>

      <div className="overflow-x-auto scrollbar-none -mx-0.5 px-0.5">
        <div className="flex items-center gap-2 min-w-max">
          {MOBILE_STATISTICS_PRESETS.map((preset) => {
            const isActive = timePreset === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                disabled={loading}
                onClick={() => onPresetChange(preset.value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap disabled:opacity-60 ${
                  isActive ? pillActive : pillInactive
                }`}
                aria-pressed={isActive}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {timePreset === 'CUSTOM' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className={DATE_INPUT_CLASS}
            aria-label={STATISTICS_UI.dateFromLabel}
          />
          <span className="text-content-muted text-sm select-none shrink-0">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className={DATE_INPUT_CLASS}
            aria-label={STATISTICS_UI.dateToLabel}
          />
        </div>
      )}

      {showFilter && (
        <TextSearchInput
          value={search}
          onChange={onSearchChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onApplySearch();
          }}
          placeholder={STATISTICS_UI.searchPlaceholder}
          widthClass="w-full"
          inputClassName="h-9 pl-9 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
        />
      )}
    </section>
  );
});

export default StatisticsMobileFilter;
