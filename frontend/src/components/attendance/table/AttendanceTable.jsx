import { memo } from 'react';
import { ATTENDANCE_TABLE_COLUMNS, UI } from '../../../constants/attendance';
import RegistryTableEmptyRow from '../../admin/sections/RegistryTableEmptyRow';
import DesktopPagination from '../../shared/DesktopPagination';
import EmployeeRow from './EmployeeRow';

const AttendanceTable = memo(function AttendanceTable({
  staffList,
  disabled,
  todayWriteDisabled = false,
  onQuickAction,
  onSaveVeSomNote,
  onOpenScanLogs,
  onOpenManualSchedule,
  page,
  totalPages,
  filteredCount,
  pageSize,
  onPageChange,
}) {
  const rows = Array.isArray(staffList) ? staffList : [];
  const isEmpty = rows.length === 0 && filteredCount === 0;

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
                  <th key={col.key} scope="col" className={thClass}>
                    {col.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {isEmpty ? (
              <RegistryTableEmptyRow
                colSpan={ATTENDANCE_TABLE_COLUMNS.length}
                message={UI.noStaff}
              />
            ) : (
              rows.map((staff) => (
                <EmployeeRow
                  key={staff.empCode}
                  staff={staff}
                  disabled={disabled}
                  todayWriteDisabled={todayWriteDisabled}
                  onQuickAction={onQuickAction}
                  onSaveVeSomNote={onSaveVeSomNote}
                  onOpenScanLogs={onOpenScanLogs}
                  onOpenManualSchedule={onOpenManualSchedule}
                />
              ))
            )}
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
