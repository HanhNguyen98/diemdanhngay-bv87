import { memo } from 'react';
import { Filter, Upload } from 'lucide-react';
import { ADMIN_UI } from '../../../../constants/admin';
import { formatDeptCode } from '../../../../utils/formatters';

const DATE_INPUT_CLASS =
  'h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus-visible:ring-2 focus-visible:ring-primary/25 min-w-[140px]';

const SELECT_CLASS =
  'h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus-visible:ring-2 focus-visible:ring-primary/25 min-w-[200px] max-w-full';

const LABEL_CLASS =
  'text-2xs font-semibold text-content-muted uppercase tracking-wider shrink-0';

const DeptAttendanceFilterBar = memo(function DeptAttendanceFilterBar({
  departments,
  deptCode,
  onDeptChange,
  date,
  onDateChange,
  onApply,
  onExport,
  loading,
  exporting,
  canExport,
}) {
  const { dashboard: d } = ADMIN_UI;

  return (
    <section className="bg-surface-white border border-gray-200 rounded-xl px-4 py-3 shadow-card">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2 min-w-0">
          <span className={LABEL_CLASS}>{d.deptDetailSelectDept}</span>
          <select
            value={deptCode ?? ''}
            onChange={(e) => onDeptChange(Number(e.target.value))}
            className={SELECT_CLASS}
            disabled={loading || !departments.length}
          >
            {departments.map((dept) => (
              <option key={dept.deptCode} value={dept.deptCode}>
                [{dept.deptCodeFormatted || formatDeptCode(dept.deptCode)}] {dept.deptName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className={LABEL_CLASS}>{d.deptDetailSelectDate}</span>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className={DATE_INPUT_CLASS}
            disabled={loading}
          />
        </label>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onExport}
            disabled={loading || exporting || !canExport}
            className="h-9 px-4 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary-light transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Upload className="w-4 h-4" />
            {d.deptDetailExportReport}
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={loading || deptCode == null}
            className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Filter className="w-4 h-4" />
            {d.deptDetailApplyFilter}
          </button>
        </div>
      </div>
    </section>
  );
});

export default DeptAttendanceFilterBar;
