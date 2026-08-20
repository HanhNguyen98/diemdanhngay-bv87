import { memo } from 'react';
import { ADMIN_UI, MOBILE_REGISTRY_PAGINATION_CLASS } from '../../../../constants/admin';
import { formatDateDMY, displayIp } from '../../../../utils/formatters';
import { formatLogDateTime } from '../../../../utils/reminderHistory';
import { useFilterDraft } from '../../../../hooks/useFilterDraft';
import MobileFilterInputRow from '../../sections/MobileFilterInputRow';
import StaffDeptFilter from '../../../staff/StaffDeptFilter';
import DateRangePickerField from '../../../ui/DateRangePickerField';
import MobilePagination from '../../../shared/MobilePagination';

const LIST_SHELL =
  'bg-surface-white border border-line rounded-xl shadow-card overflow-hidden';

const AttendanceAuditMobileSection = memo(function AttendanceAuditMobileSection({
  departments,
  deptFilter,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApplyFilter,
  onResetFilter,
  items,
  initialLoading,
  refreshing = false,
  filteredCount,
  page,
  totalPages,
  onPageChange,
}) {
  const { dashboard: d } = ADMIN_UI;
  const { draft, patchDraft } = useFilterDraft({ dept: deptFilter });

  const applyFilters = () => {
    onApplyFilter(draft.dept);
  };

  return (
    <div className="lg:hidden flex flex-col gap-2 min-w-0 max-w-full">
      <section className={LIST_SHELL}>
        <div className="px-3 py-2.5 border-b border-line">
          <h3 className="admin-section-title text-xs uppercase">{d.attendanceAuditListTitle}</h3>
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
            ariaLabel={d.attendanceAuditFilterRange}
            className="w-full"
          />
        </div>

        <div className={`relative ${refreshing ? 'opacity-70' : ''}`}>
          {initialLoading ? (
            <div className="p-4 text-sm text-content-muted animate-pulse">{ADMIN_UI.loading}</div>
          ) : !items.length ? (
            <p className="px-3 py-6 text-sm text-content-muted text-center">{d.attendanceAuditEmpty}</p>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((row, index) => (
                <li
                  key={row.id ?? `${row.createdAt}-${row.username}-${index}`}
                  className="px-3 py-3 space-y-1"
                >
                  <p className="text-sm font-semibold text-navy">{row.actionLabel || row.action}</p>
                  <p className="text-xs text-content-muted tabular-nums">
                    {formatLogDateTime(row.createdAt)}
                    {row.username ? ` · ${row.username}` : ''}
                  </p>
                  <p className="text-xs text-content-muted">
                    {row.deptCodeFormatted || '—'}
                    {row.empCodeFormatted ? ` · NV ${row.empCodeFormatted}` : ''}
                    {row.attendanceDate ? ` · ${formatDateDMY(row.attendanceDate)}` : ''}
                  </p>
                  <p className="text-xs text-content-muted truncate" title={row.userAgent || ''}>
                    {displayIp(row.clientIp) || '—'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <MobilePagination
        className={MOBILE_REGISTRY_PAGINATION_CLASS}
        page={page}
        totalPages={totalPages}
        totalItems={filteredCount}
        onPageChange={onPageChange}
      />
    </div>
  );
});

export default AttendanceAuditMobileSection;
