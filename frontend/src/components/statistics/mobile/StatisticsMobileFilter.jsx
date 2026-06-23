import { memo } from 'react';
import {
  MOBILE_STATISTICS_PRESETS,
  STATISTICS_UI,
} from '../../../constants/attendance';
import MobileFilterApplyRow from '../../admin/sections/MobileFilterApplyRow';
import TextSearchInput from '../../shared/TextSearchInput';
import DateRangePickerField from '../../ui/DateRangePickerField';

const pillActive = 'bg-primary text-white font-semibold shadow-sm';
const pillInactive = 'bg-neutral text-content-body hover:bg-neutral/80';

const StatisticsMobileFilter = memo(function StatisticsMobileFilter({
  timePreset,
  onPresetChange,
  dateFrom,
  dateTo,
  onRangeChange,
  search,
  onSearchChange,
  onApplySearch,
  onResetSearch,
  loading,
}) {
  return (
    <section className="lg:hidden shrink-0 space-y-3 min-w-0" aria-label={STATISTICS_UI.timeRangeLabel}>
      <span className="block text-2xs font-semibold text-content-muted uppercase tracking-wider">
        {STATISTICS_UI.timeRangeLabel}
      </span>

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
        <DateRangePickerField
          dateFrom={dateFrom}
          dateTo={dateTo}
          onRangeChange={onRangeChange}
          disabled={loading}
          ariaLabel={STATISTICS_UI.timeRangeLabel}
        />
      )}

      <div className="flex items-center gap-2 min-w-0">
        <TextSearchInput
          value={search}
          onChange={onSearchChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onApplySearch();
          }}
          placeholder={STATISTICS_UI.searchPlaceholder}
          widthClass="flex-1 min-w-0"
          inputClassName="h-9 pl-3 rounded-lg border border-line text-sm text-content-body bg-surface-white outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          showSearchIcon={false}
        />
        <MobileFilterApplyRow
          onApply={onApplySearch}
          onReset={onResetSearch}
          disabled={loading}
        />
      </div>
    </section>
  );
});

export default StatisticsMobileFilter;
