import { memo } from 'react';
import { ATTENDANCE_FILTER, STATUS_OPTIONS, UI } from '../../../constants/attendance';
import { IconFilter } from '../../icons/Icons';
import TextSearchInput from '../../shared/TextSearchInput';
import AttendanceTable from '../table/AttendanceTable';
import AttendanceStaffCardList from '../mobile/AttendanceStaffCardList';
import MobilePagination from '../../shared/MobilePagination';
import { MOBILE_UI } from '../../../constants/attendance';

const SEARCH_BG = 'bg-[#E6EEFE]';

const pillActive = 'bg-pagination-active text-white border-pagination-active';
const pillInactive = 'border-slate-200 text-slate-500 hover:bg-slate-50 bg-white';

const StaffTableCard = memo(function StaffTableCard({
  staffList,
  mobileStaffList,
  disabled,
  onQuickAction,
  search,
  onSearchChange,
  showFilter,
  onToggleFilter,
  statusFilter,
  onStatusFilterChange,
  page,
  totalPages,
  filteredCount,
  pageSize,
  onPageChange,
  className = '',
}) {
  const mobileList = mobileStaffList ?? staffList;
  const mobileTotalItems = filteredCount ?? mobileList.length;

  return (
    <>
    <section
      className={`bg-white rounded-xl border border-slate-200 shadow-sm lg:overflow-hidden lg:flex lg:flex-col lg:flex-1 lg:min-h-0 ${className}`}
      aria-label={UI.staffListTitle}
    >
      <div className="lg:hidden shrink-0 px-3 py-2 border-b border-slate-200">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-navy">{MOBILE_UI.staffListTitle}</h2>
          <button
            type="button"
            onClick={onToggleFilter}
            aria-expanded={showFilter}
            className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-sm font-medium transition-colors shrink-0 ${
              showFilter
                ? 'border-primary/30 bg-blue-50 text-primary'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50 bg-white'
            }`}
          >
            <IconFilter className="w-3.5 h-3.5" aria-hidden="true" />
            {UI.filterButton}
          </button>
        </div>
      </div>

      <div className="hidden lg:flex shrink-0 px-4 py-2 border-b border-slate-200 items-center gap-2">
        <TextSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={UI.searchPlaceholder}
          widthClass="flex-1 min-w-0"
          inputClassName={`h-8 pl-9 pr-3 rounded-lg border-0 ${SEARCH_BG} text-sm text-gray-700 outline-none focus-visible:ring-2 focus-visible:ring-primary/25 placeholder:text-slate-400 transition-colors`}
        />
        <button
          type="button"
          onClick={onToggleFilter}
          aria-expanded={showFilter}
          className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-sm font-medium transition-colors shrink-0 ${
            showFilter
              ? 'border-primary/30 bg-blue-50 text-primary'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50 bg-white'
          }`}
        >
          <IconFilter className="w-3.5 h-3.5" aria-hidden="true" />
          {UI.filterButton}
        </button>
      </div>

      {showFilter && (
        <div className="shrink-0 px-3 lg:px-4 py-2 border-b border-slate-200 bg-slate-50/60 space-y-2">
          <div className="lg:hidden">
            <TextSearchInput
              value={search}
              onChange={onSearchChange}
              placeholder={UI.searchPlaceholder}
              widthClass="w-full"
              inputClassName={`h-9 pl-9 pr-3 rounded-lg border-0 ${SEARCH_BG} text-sm text-gray-700 outline-none focus-visible:ring-2 focus-visible:ring-primary/25 placeholder:text-slate-400 transition-colors`}
            />
          </div>
          <p className="text-2xs font-semibold text-slate-500 uppercase tracking-wide">
            {UI.filterByStatus}
          </p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={UI.filterByStatus}>
            <button
              type="button"
              onClick={() => onStatusFilterChange(ATTENDANCE_FILTER.ALL)}
              className={`px-2.5 py-1 rounded-full text-3xs font-medium border transition-colors ${
                statusFilter === ATTENDANCE_FILTER.ALL ? pillActive : pillInactive
              }`}
            >
              {UI.filterAll}
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange(ATTENDANCE_FILTER.UNCHECKED)}
              className={`px-2.5 py-1 rounded-full text-3xs font-medium border transition-colors ${
                statusFilter === ATTENDANCE_FILTER.UNCHECKED ? pillActive : pillInactive
              }`}
            >
              {UI.filterUnchecked}
            </button>
            {STATUS_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => onStatusFilterChange(value)}
                className={`px-2.5 py-1 rounded-full text-3xs font-medium border transition-colors ${
                  statusFilter === value ? pillActive : pillInactive
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="lg:hidden">
        <AttendanceStaffCardList
          staffList={mobileList}
          disabled={disabled}
          onQuickAction={onQuickAction}
        />
      </div>

      <div className="hidden lg:flex flex-col flex-1 min-h-0">
        <AttendanceTable
          staffList={staffList}
          disabled={disabled}
          onQuickAction={onQuickAction}
          page={page}
          totalPages={totalPages}
          filteredCount={filteredCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      </div>
    </section>

    <MobilePagination
      className="lg:hidden shrink-0"
      page={page}
      totalPages={totalPages}
      totalItems={mobileTotalItems}
      onPageChange={onPageChange}
    />
    </>
  );
});

export default StaffTableCard;
