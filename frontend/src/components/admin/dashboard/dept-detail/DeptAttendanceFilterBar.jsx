import { memo } from 'react';
import { RotateCcw, Search, Upload } from 'lucide-react';
import { ADMIN_UI } from '../../../../constants/admin';
import StaffDeptFilter from '../../../staff/StaffDeptFilter';
import DatePickerField from '../../../ui/DatePickerField';

const LABEL_CLASS =
  'text-3xs font-semibold text-content-muted uppercase mt-1';

const RESET_BTN_CLASS =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-white text-content-muted hover:bg-neutral transition-colors disabled:opacity-60';

const DeptAttendanceFilterBar = memo(function DeptAttendanceFilterBar({
  departments,
  deptCode,
  onDeptChange,
  date,
  onDateChange,
  onApply,
  onReset,
  onExport,
  initialLoading,
  exporting,
  canExport,
}) {
  const { dashboard: d } = ADMIN_UI;

  return (
    <section className="hidden lg:block bg-surface-white border border-line rounded-xl px-4 py-3 shadow-card">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <StaffDeptFilter
          departments={departments}
          value={deptCode}
          onChange={onDeptChange}
          disabled={initialLoading || !departments.length}
          className="w-[220px] shrink-0"
        />

        <div className="flex items-center gap-2 min-w-0">
          <span className={`${LABEL_CLASS} shrink-0`}>{d.deptDetailSelectDate}</span>
          <DatePickerField
            value={date}
            onChange={onDateChange}
            disabled={initialLoading}
            ariaLabel={d.deptDetailSelectDate}
            className="w-auto"
            triggerClassName="min-w-[160px]"
          />
          <button
            type="button"
            onClick={onApply}
            disabled={initialLoading}
            className="h-9 shrink-0 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            {d.deptDetailApplyFilter}
          </button>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              disabled={initialLoading}
              title={ADMIN_UI.resetFilters}
              aria-label={ADMIN_UI.resetFilters}
              className={RESET_BTN_CLASS}
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onExport}
            disabled={initialLoading || exporting || !canExport}
            className="h-9 px-4 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary-light transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Upload className="w-4 h-4" />
            {d.deptDetailExportReport}
          </button>
        </div>
      </div>
    </section>
  );
});

export default DeptAttendanceFilterBar;
