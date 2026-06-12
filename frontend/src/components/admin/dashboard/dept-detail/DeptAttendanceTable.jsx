import { memo } from 'react';
import { ADMIN_UI } from '../../../../constants/admin';
import TablePagination from '../../sections/TablePagination';
import DeptAttendanceRow from './DeptAttendanceRow';

const COLUMNS = [
  { key: 'empCode', labelKey: 'deptDetailColEmpCode', width: '14%' },
  { key: 'fullname', labelKey: 'deptDetailColStaff', width: '34%' },
  { key: 'status', labelKey: 'deptDetailColStatus', width: '22%' }
];

const DeptAttendanceTable = memo(function DeptAttendanceTable({
  items,
  loading,
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) {
  const { dashboard: d } = ADMIN_UI;
  const colCount = COLUMNS.length;

  return (
    <section className="bg-surface-white border border-gray-200 rounded-xl shadow-card overflow-hidden flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full min-w-[720px] table-fixed text-sm">
          <colgroup>
            {COLUMNS.map((col) => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10 bg-surface-white">
            <tr className="table-header-row">
              {COLUMNS.map((col) => (
                <th key={col.key} scope="col" className="table-th-left">
                  {d[col.labelKey]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
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
                <DeptAttendanceRow key={staff.empCode} staff={staff} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalItems > 0 && (
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
