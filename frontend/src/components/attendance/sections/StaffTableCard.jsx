import { memo, useEffect, useState } from 'react';
import { RotateCcw, Search, X } from 'lucide-react';
import MobileFilterApplyRow from '../../admin/sections/MobileFilterApplyRow';
import { ADMIN_UI } from '../../../constants/admin';
import { ATTENDANCE_FILTER, MOBILE_UI, STATISTICS_UI, UI } from '../../../constants/attendance';
import { getAttendanceStaffFilterDefaults } from '../../../utils/filterResetDefaults';
import { useAttendanceStatusConfig } from '../../../context/AttendanceStatusContext';
import TextSearchInput from '../../shared/TextSearchInput';
import RefreshOverlay from '../../shared/RefreshOverlay';
import AttendanceTable from '../table/AttendanceTable';
import AttendanceStaffCardList from '../mobile/AttendanceStaffCardList';
import MobilePagination from '../../shared/MobilePagination';

const CONTROL_CLASS =
  'h-9 rounded-lg border border-line text-sm text-content-body bg-surface-white outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-colors';

const SEARCH_INPUT_CLASS = `${CONTROL_CLASS} w-full min-w-0 pl-3 hover:bg-neutral`;

const STATUS_SELECT_CLASS = `${CONTROL_CLASS} w-full min-w-0 pl-2.5 appearance-none`;

const APPLY_BTN_CLASS =
  'h-9 shrink-0 px-3 lg:px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap';

const RESET_BTN_CLASS =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-white text-content-muted hover:bg-neutral transition-colors';

const DESKTOP_SEARCH_WIDTH = 'shrink-0 w-[min(100%,20rem)]';
const DESKTOP_STATUS_WIDTH = 'shrink-0 w-[13.5rem]';

function AttendanceStatusFilterSelect({
  value,
  onChange,
  className = '',
  widthClass = '',
}) {
  const { statusOptions } = useAttendanceStatusConfig();
  const isDefault = value === ATTENDANCE_FILTER.ALL;
  const hasFilter = !isDefault;

  return (
    <div className={`relative min-w-0 ${widthClass}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${STATUS_SELECT_CLASS} ${hasFilter ? 'pr-9' : 'pr-2.5'} ${
          isDefault ? 'text-content-muted' : 'text-content-body'
        } ${className}`}
        aria-label={UI.filterByStatus}
      >
        <option value={ATTENDANCE_FILTER.ALL}>{UI.filterByStatus}</option>
        <option value={ATTENDANCE_FILTER.UNCHECKED}>{UI.filterUnchecked}</option>
        {statusOptions.map(({ value: optionValue, label }) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
      {hasFilter && (
        <button
          type="button"
          onClick={() => onChange(ATTENDANCE_FILTER.ALL)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center text-content-muted hover:text-content-heading hover:bg-neutral transition-colors"
          aria-label={UI.filterClearStatus}
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

const StaffTableCard = memo(function StaffTableCard({
  staffList,
  mobileStaffList,
  disabled,
  todayWriteDisabled = false,
  onQuickAction,
  onSaveVeSomNote,
  onOpenScanLogs,
  onOpenManualSchedule,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  page,
  totalPages,
  filteredCount,
  pageSize,
  onPageChange,
  showMobileFilterReset = false,
  refreshing = false,
  className = '',
}) {
  const [searchDraft, setSearchDraft] = useState(search);
  const mobileList = mobileStaffList ?? staffList;
  const mobileTotalItems = filteredCount ?? mobileList.length;

  useEffect(() => {
    setSearchDraft(search);
  }, [search]);

  const handleApplySearch = () => {
    onSearchChange(searchDraft);
  };

  const handleResetFilters = () => {
    const { search: nextSearch, statusFilter: nextStatus } = getAttendanceStaffFilterDefaults();
    setSearchDraft(nextSearch);
    onSearchChange(nextSearch);
    onStatusFilterChange(nextStatus);
  };

  const searchField = (
    <TextSearchInput
      value={searchDraft}
      onChange={setSearchDraft}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleApplySearch();
      }}
      placeholder={UI.searchPlaceholder}
      widthClass="w-full min-w-0"
      inputClassName={SEARCH_INPUT_CLASS}
      showSearchIcon={false}
    />
  );

  const applyButton = (
    <button
      type="button"
      onClick={handleApplySearch}
      className={APPLY_BTN_CLASS}
      aria-label={STATISTICS_UI.applyFilter}
    >
      <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="hidden lg:inline">{STATISTICS_UI.applyFilter}</span>
    </button>
  );

  const resetButton = showMobileFilterReset ? (
    <button
      type="button"
      onClick={handleResetFilters}
      className={RESET_BTN_CLASS}
      title={ADMIN_UI.resetFilters}
      aria-label={ADMIN_UI.resetFilters}
    >
      <RotateCcw className="w-4 h-4" aria-hidden="true" />
    </button>
  ) : null;

  return (
    <section
      className={`bg-surface-white rounded-xl border border-line shadow-sm lg:overflow-hidden lg:flex lg:flex-col lg:flex-1 lg:min-h-0 ${className}`}
      aria-label={UI.staffListTitle}
    >
      <div className="lg:hidden shrink-0 px-3 py-2 border-b border-line space-y-2">
        <h2 className="text-sm font-bold text-navy">{MOBILE_UI.staffListTitle}</h2>
        {searchField}
        <div className="flex items-center gap-2 min-w-0">
          <AttendanceStatusFilterSelect
            value={statusFilter}
            onChange={onStatusFilterChange}
            widthClass="flex-1 min-w-0"
          />
          {showMobileFilterReset ? (
            <MobileFilterApplyRow onApply={handleApplySearch} onReset={handleResetFilters} />
          ) : (
            applyButton
          )}
        </div>
      </div>

      <div className="hidden lg:flex shrink-0 px-4 py-2 border-b border-line items-center gap-2 min-w-0">
        <div className={DESKTOP_SEARCH_WIDTH}>{searchField}</div>
        <AttendanceStatusFilterSelect
          value={statusFilter}
          onChange={onStatusFilterChange}
          widthClass={DESKTOP_STATUS_WIDTH}
        />
        {applyButton}
        {resetButton}
      </div>

      <div className="lg:hidden relative">
        {refreshing && <RefreshOverlay />}
        <AttendanceStaffCardList
          staffList={mobileList}
          disabled={disabled}
          todayWriteDisabled={todayWriteDisabled}
          onQuickAction={onQuickAction}
          onSaveVeSomNote={onSaveVeSomNote}
          onOpenScanLogs={onOpenScanLogs}
          onOpenManualSchedule={onOpenManualSchedule}
        />
        <MobilePagination
          sticky={false}
          className="border-t border-line/60 py-2"
          page={page}
          totalPages={totalPages}
          totalItems={mobileTotalItems}
          onPageChange={onPageChange}
        />
      </div>

      <div className="hidden lg:flex flex-col flex-1 min-h-0 relative">
        {refreshing && <RefreshOverlay />}
        <AttendanceTable
          staffList={staffList}
          disabled={disabled}
          todayWriteDisabled={todayWriteDisabled}
          onQuickAction={onQuickAction}
          onSaveVeSomNote={onSaveVeSomNote}
          onOpenScanLogs={onOpenScanLogs}
          onOpenManualSchedule={onOpenManualSchedule}
          page={page}
          totalPages={totalPages}
          filteredCount={filteredCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      </div>
    </section>
  );
});

export default StaffTableCard;
