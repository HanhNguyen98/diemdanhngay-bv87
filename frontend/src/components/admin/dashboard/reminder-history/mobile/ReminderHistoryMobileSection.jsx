import { memo } from 'react';
import { Download } from 'lucide-react';
import { ADMIN_UI, MOBILE_REGISTRY_PAGINATION_CLASS } from '../../../../../constants/admin';
import { useFilterDraft } from '../../../../../hooks/useFilterDraft';
import MobileFilterInputRow from '../../../sections/MobileFilterInputRow';
import StaffDeptFilter from '../../../../staff/StaffDeptFilter';
import DateRangePickerField from '../../../../ui/DateRangePickerField';
import MobilePagination from '../../../../shared/MobilePagination';
import ReminderHistoryCardList from './ReminderHistoryCardList';

const LIST_SHELL =
  'bg-surface-white border border-line rounded-xl shadow-card overflow-hidden';

const ReminderHistoryMobileSection = memo(function ReminderHistoryMobileSection({
  departments,
  deptFilter,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApplyFilter,
  onResetFilter,
  items,
  loading,
  initialLoading: initialLoadingProp,
  refreshing = false,
  filteredCount,
  page,
  totalPages,
  onPageChange,
  exporting,
  onExport,
}) {
  const { dashboard: d } = ADMIN_UI;
  const { draft, patchDraft } = useFilterDraft({ dept: deptFilter });
  const initialLoading = initialLoadingProp ?? loading;

  const applyFilters = () => {
    onApplyFilter(draft.dept);
  };

  return (
    <div className="lg:hidden flex flex-col gap-2 min-w-0 max-w-full">
      <section className={LIST_SHELL}>
        <div className="px-3 py-2.5 border-b border-line flex items-center justify-between gap-2">
          <h3 className="admin-section-title flex items-center gap-2 text-xs uppercase">
            {d.reminderListTitle}
          </h3>
          <button
            type="button"
            onClick={onExport}
            disabled={exporting || initialLoading || filteredCount === 0}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-primary/30 text-xs font-semibold text-primary hover:bg-primary-light transition-colors disabled:opacity-50 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            {d.reminderExportExcel}
          </button>
        </div>

        <div className="px-3 py-2.5 border-b border-line space-y-2">
          <MobileFilterInputRow onApply={applyFilters} onReset={onResetFilter} disabled={initialLoading}>
            <StaffDeptFilter
              departments={departments}
              value={draft.dept}
              onChange={(dept) => patchDraft({ dept })}
              className="w-full"
            />
          </MobileFilterInputRow>
          <DateRangePickerField
            dateFrom={dateFrom}
            dateTo={dateTo}
            onRangeChange={(from, to) => {
              onDateFromChange(from);
              onDateToChange(to);
            }}
            disabled={initialLoading}
            ariaLabel={d.reminderFilterRange}
            className="w-full"
          />
        </div>

        {initialLoading && filteredCount === 0 ? (
          <div className="py-20 text-center text-content-muted animate-pulse">{ADMIN_UI.loading}</div>
        ) : (
          <div className="relative">
            {refreshing && (
              <div
                className="absolute inset-0 z-10 bg-surface-white/40 pointer-events-none"
                aria-hidden="true"
              />
            )}
            <ReminderHistoryCardList items={items} />
            <MobilePagination
              sticky={false}
              className={MOBILE_REGISTRY_PAGINATION_CLASS}
              page={page}
              totalPages={totalPages}
              totalItems={filteredCount}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </section>
    </div>
  );
});

export default ReminderHistoryMobileSection;
