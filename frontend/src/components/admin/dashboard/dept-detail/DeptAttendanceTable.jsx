import { memo } from 'react';
import { ADMIN_UI } from '../../../../constants/admin';
import RefreshOverlay from '../../../shared/RefreshOverlay';
import TablePagination from '../../sections/TablePagination';
import DeptAttendanceRow from './DeptAttendanceRow';

const COLUMNS = [
  { key: 'empCode', labelKey: 'deptDetailColEmpCode', width: '8%' },
  { key: 'fullname', labelKey: 'deptDetailColStaff', width: '16%' },
  { key: 'times', labelKey: 'deptDetailColTimes', width: '16%' },
  { key: 'machine', labelKey: 'deptDetailColMachine', width: '12%' },
  { key: 'status', labelKey: 'deptDetailColStatus', width: '12%' },
  { key: 'note', labelKey: 'deptDetailColNote', width: '12%' },
  { key: 'actions', labelKey: 'deptDetailColActions', width: '24%' },
];

const DeptAttendanceTable = memo(function DeptAttendanceTable({
  items,
  initialLoading,
  refreshing = false,
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onOpenScanLogs,
  onOpenManualSchedule,
  onFillTimes,
  onQuickAction,
  onClearAttendance,
  onSaveVeSomNote,
}) {
  const { dashboard: d } = ADMIN_UI;
  const colCount = COLUMNS.length;

  return (
    <section className="hidden lg:flex bg-surface-white border border-line rounded-xl shadow-card overflow-hidden flex-col flex-1 min-h-0">
      <div className="relative flex-1 min-h-0 overflow-auto">
        {refreshing && <RefreshOverlay />}
        <table className="w-full min-w-[860px] table-fixed text-sm">
          <colgroup>
            {COLUMNS.map((col) => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10 bg-surface-white">
            <tr className="table-header-row">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={col.key === 'actions' ? 'table-th-right' : 'table-th-left'}
                >
                  {d[col.labelKey]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {initialLoading ? (
              <tr>
                <td colSpan={colCount} className="py-20 text-center text-content-muted animate-pulse">
                  {d.deptDetailLoading}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="py-20 text-center text-content-muted text-sm">
                  {d.deptDetailEmpty}
                </td>
              </tr>
            ) : (
              items.map((staff) => (
                <DeptAttendanceRow
                  key={staff.empCode}
                  staff={staff}
                  onOpenScanLogs={onOpenScanLogs}
                  onOpenManualSchedule={onOpenManualSchedule}
                  onFillTimes={onFillTimes}
                  onQuickAction={onQuickAction}
                  onClearAttendance={onClearAttendance}
                  onSaveVeSomNote={onSaveVeSomNote}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {!initialLoading && totalItems > 0 && (
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
          unitLabel="nhân viên"
          formatShowing={d.deptDetailShowing}
        />
      )}
    </section>
  );
});

export default DeptAttendanceTable;
