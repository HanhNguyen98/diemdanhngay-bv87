import { memo } from 'react';
import { ADMIN_UI } from '../../../../constants/admin';
import { formatDateDMY, displayIp } from '../../../../utils/formatters';
import { formatLogDateTime } from '../../../../utils/reminderHistory';
import RegistryTableShell from '../../sections/RegistryTableShell';
import RegistryTableEmptyRow from '../../sections/RegistryTableEmptyRow';
import TablePagination from '../../sections/TablePagination';
import ReminderHistoryFilterBar from '../../dashboard/reminder-history/ReminderHistoryFilterBar';

const AttendanceAuditTable = memo(function AttendanceAuditTable({
  items,
  filteredCount,
  page,
  totalPages,
  pageSize,
  onPageChange,
  loading,
  initialLoading: initialLoadingProp,
  refreshing = false,
  departments,
  deptFilter,
  onDeptFilterChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApplyFilter,
  onResetFilter,
  className = '',
}) {
  const { dashboard: d } = ADMIN_UI;
  const initialLoading = initialLoadingProp ?? loading;

  return (
    <RegistryTableShell
      className={className}
      title={d.attendanceAuditListTitle}
      toolbar={
        <div className="flex items-center gap-2 w-full min-w-0">
          <ReminderHistoryFilterBar
            departments={departments}
            deptFilter={deptFilter}
            onDeptFilterChange={onDeptFilterChange}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={onDateFromChange}
            onDateToChange={onDateToChange}
            onApply={onApplyFilter}
            onReset={onResetFilter}
            loading={initialLoading}
            layout="desktop-toolbar"
            rangeLabel={d.attendanceAuditFilterRange}
          />
        </div>
      }
      initialLoading={initialLoading}
      refreshing={refreshing}
      loadingLabel={ADMIN_UI.loading}
      footer={
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
          unitLabel={d.attendanceAuditUnit}
        />
      }
    >
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col style={{ width: '10.5rem' }} />
          <col style={{ width: '8rem' }} />
          <col style={{ width: '6.5rem' }} />
          <col style={{ width: '7rem' }} />
          <col style={{ width: '7.5rem' }} />
          <col />
          <col style={{ width: '8.5rem' }} />
        </colgroup>
        <thead className="sticky top-0 z-10">
          <tr className="table-header-row">
            <th className="table-th-left whitespace-nowrap">{d.attendanceAuditColTime}</th>
            <th className="table-th-left whitespace-nowrap">{d.attendanceAuditColUser}</th>
            <th className="table-th-left whitespace-nowrap">{d.attendanceAuditColDept}</th>
            <th className="table-th-left whitespace-nowrap">{d.attendanceAuditColEmp}</th>
            <th className="table-th-left whitespace-nowrap">{d.attendanceAuditColDate}</th>
            <th className="table-th-left whitespace-nowrap">{d.attendanceAuditColAction}</th>
            <th className="table-th-left whitespace-nowrap">{d.attendanceAuditColIp}</th>
          </tr>
        </thead>
        <tbody>
          {!initialLoading && (!Array.isArray(items) || items.length === 0) ? (
            <RegistryTableEmptyRow colSpan={7} message={d.attendanceAuditEmpty} />
          ) : (
            (items ?? []).map((row, index) => (
              <tr
                key={row.id ?? `${row.createdAt}-${row.username}-${row.action}-${index}`}
                className="border-b border-line/60 hover:bg-surface-page/50 transition-colors"
              >
                <td className="py-3 px-4 text-content-muted text-xs tabular-nums whitespace-nowrap">
                  {formatLogDateTime(row.createdAt)}
                </td>
                <td className="py-3 px-4 admin-cell-name truncate" title={row.username}>
                  {row.username}
                </td>
                <td className="py-3 px-4 tabular-nums whitespace-nowrap">
                  {row.deptCodeFormatted || '—'}
                </td>
                <td className="py-3 px-4 tabular-nums whitespace-nowrap">
                  {row.empCodeFormatted || '—'}
                </td>
                <td className="py-3 px-4 tabular-nums whitespace-nowrap">
                  {row.attendanceDate ? formatDateDMY(row.attendanceDate) : '—'}
                </td>
                <td className="py-3 px-4 truncate" title={row.actionLabel || row.action}>
                  {row.actionLabel || row.action}
                </td>
                <td
                  className="py-3 px-4 text-content-muted text-xs truncate"
                  title={row.userAgent || row.clientIp || ''}
                >
                  {displayIp(row.clientIp) || '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </RegistryTableShell>
  );
});

export default AttendanceAuditTable;
