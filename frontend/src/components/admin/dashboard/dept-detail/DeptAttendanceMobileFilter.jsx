import { memo } from 'react';
import { Upload } from 'lucide-react';
import { ADMIN_UI } from '../../../../constants/admin';
import StaffDeptFilter from '../../../staff/StaffDeptFilter';
import DatePickerField from '../../../ui/DatePickerField';
import MobileFilterInputRow from '../../sections/MobileFilterInputRow';

const LABEL_CLASS =
  'text-4xs font-semibold text-content-muted uppercase mt-0.5';

const DeptAttendanceMobileFilter = memo(function DeptAttendanceMobileFilter({
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
    <section
      className="lg:hidden bg-surface-white border border-line rounded-xl px-3 py-3 shadow-card space-y-3"
      aria-label="Bộ lọc chi tiết Chấm công"
    >
      <StaffDeptFilter
        departments={departments}
        value={deptCode}
        onChange={onDeptChange}
        disabled={initialLoading || !departments.length}
        className="w-full"
      />

      <div className="space-y-1.5">
        <span className={LABEL_CLASS}>{d.deptDetailSelectDate}</span>
        <MobileFilterInputRow onApply={onApply} onReset={onReset} disabled={initialLoading}>
          <DatePickerField
            value={date}
            onChange={onDateChange}
            disabled={initialLoading}
            ariaLabel={d.deptDetailSelectDate}
            className="w-full"
          />
        </MobileFilterInputRow>
      </div>

      <button
        type="button"
        onClick={onExport}
        disabled={initialLoading || exporting || !canExport}
        className="w-full h-9 px-3 rounded-lg border border-primary text-primary text-3xs font-medium hover:bg-primary-light transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
      >
        <Upload className="w-3.5 h-3.5 shrink-0" />
        {d.deptDetailExportReport}
      </button>
    </section>
  );
});

export default DeptAttendanceMobileFilter;
