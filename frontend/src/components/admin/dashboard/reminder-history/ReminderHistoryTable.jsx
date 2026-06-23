import { memo } from 'react';
import { Download } from 'lucide-react';
import { ADMIN_UI } from '../../../../constants/admin';
import { formatDateDMY } from '../../../../utils/formatters';
import { formatLogDateTime } from '../../../../utils/reminderHistory';
import RegistryTableShell from '../../sections/RegistryTableShell';
import RegistryTableEmptyRow from '../../sections/RegistryTableEmptyRow';
import TablePagination from '../../sections/TablePagination';
import ReminderTypeBadge from './ReminderTypeBadge';
import ReminderHistoryFilterBar from './ReminderHistoryFilterBar';

const ReminderHistoryTable = memo(function ReminderHistoryTable({
  items,
  filteredCount,
  page,
  totalPages,
  pageSize,
  onPageChange,
  loading,
  initialLoading: initialLoadingProp,
  refreshing = false,
  exporting,
  onExport,
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
      title={d.reminderListTitle}
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
          />
          <button
            type="button"
            onClick={onExport}
            disabled={exporting || initialLoading || filteredCount === 0}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-line text-sm font-medium text-primary hover:bg-neutral bg-white transition-colors disabled:opacity-50 shrink-0 lg:ml-auto"
          >
            <Download className="w-3.5 h-3.5" />
            {d.reminderExportExcel}
          </button>
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
          unitLabel="lần nhắc"
        />
      }
    >
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col style={{ width: '11rem' }} />
          <col />
          <col style={{ width: '7.75rem' }} />
          <col style={{ width: '10.5rem' }} />
        </colgroup>
        <thead className="sticky top-0 z-10">
          <tr className="table-header-row">
            <th className="table-th-left whitespace-nowrap">{d.reminderHistoryColDate}</th>
            <th className="table-th-left">{d.reminderHistoryColDept}</th>
            <th className="table-th-left">{d.reminderHistoryColType}</th>
            <th className="table-th-left">{d.reminderHistoryColTime}</th>
          </tr>
        </thead>
        <tbody>
          {!initialLoading && (!Array.isArray(items) || items.length === 0) ? (
            <RegistryTableEmptyRow colSpan={4} message={d.reminderHistoryEmpty} />
          ) : (
            (items ?? []).map((row) => (
              <tr
                key={row.id}
                className="border-b border-line/60 hover:bg-surface-page/50 transition-colors"
              >
                <td className="py-3 px-4 text-content-body tabular-nums whitespace-nowrap">
                  {formatDateDMY(row.attendanceDate)}
                </td>
                <td className="py-3 px-4 admin-cell-name">{row.deptName}</td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <ReminderTypeBadge triggerType={row.triggerType} />
                </td>
                <td className="py-3 px-4 text-content-muted text-xs tabular-nums whitespace-nowrap">
                  {formatLogDateTime(row.createdAt)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </RegistryTableShell>
  );
});

export default ReminderHistoryTable;
