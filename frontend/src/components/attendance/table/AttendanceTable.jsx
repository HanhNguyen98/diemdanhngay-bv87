import { memo } from 'react';
import { ATTENDANCE_TABLE_COLUMNS, UI } from '../../../constants/attendance';
import DesktopPagination from '../../shared/DesktopPagination';
import EmployeeRow from './EmployeeRow';

const AttendanceTable = memo(function AttendanceTable({
  staffList,
  disabled,
  onQuickAction,
  page,
  totalPages,
  filteredCount,
  pageSize,
  onPageChange,
}) {
  if (!staffList?.length && filteredCount === 0) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center text-sm text-slate-500">
        {UI.noStaff}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full table-fixed text-sm" aria-label={UI.staffListTitle}>
          <colgroup>
            {ATTENDANCE_TABLE_COLUMNS.map((col) => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="table-header-row">
              {ATTENDANCE_TABLE_COLUMNS.map((col) => {
                const thClass = col.key === 'actions' ? 'table-th-right' : 'table-th-left';

                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={thClass}
                  >
                    {col.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {staffList.map((staff) => (
              <EmployeeRow
                key={staff.empCode}
                staff={staff}
                disabled={disabled}
                onQuickAction={onQuickAction}
              />
            ))}
          </tbody>
        </table>
      </div>
      <DesktopPagination
        embedded
        page={page}
        totalPages={totalPages}
        totalItems={filteredCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
        summaryMode="range"
      />
    </div>
  );
});

export default AttendanceTable;
