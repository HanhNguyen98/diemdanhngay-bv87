import { memo } from 'react';
import { Download } from 'lucide-react';
import { ADMIN_UI } from '../../../../constants/admin';
import { formatDateDMY } from '../../../../utils/formatters';
import { formatLogDateTime } from '../../../../utils/reminderHistory';
import RegistryTableShell from '../../sections/RegistryTableShell';
import TablePagination from '../../sections/TablePagination';
import ReminderTypeBadge from './ReminderTypeBadge';

const ReminderHistoryTable = memo(function ReminderHistoryTable({
  items,
  filteredCount,
  page,
  totalPages,
  pageSize,
  onPageChange,
  loading,
  exporting,
  onExport,
  className = '',
}) {
  const { dashboard: d } = ADMIN_UI;

  return (
    <RegistryTableShell
      className={className}
      title={d.reminderListTitle}
      excelControl={
        <button
          type="button"
          onClick={onExport}
          disabled={exporting || loading || filteredCount === 0}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-gray-200 text-sm font-medium text-primary hover:bg-neutral bg-white transition-colors disabled:opacity-50 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          {d.reminderExportExcel}
        </button>
      }
      loading={loading && filteredCount === 0}
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
      {!loading && items.length === 0 ? (
        <div className="text-center py-16 text-content-muted text-sm">{d.reminderHistoryEmpty}</div>
      ) : (
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
            {items.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-100 hover:bg-surface-page/50 transition-colors"
              >
                <td className="py-3 px-4 text-gray-700 tabular-nums whitespace-nowrap">
                  {formatDateDMY(row.attendanceDate)}
                </td>
                <td className="py-3 px-4 font-medium text-gray-800">{row.deptName}</td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <ReminderTypeBadge triggerType={row.triggerType} />
                </td>
                <td className="py-3 px-4 text-content-muted text-xs tabular-nums whitespace-nowrap">
                  {formatLogDateTime(row.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </RegistryTableShell>
  );
});

export default ReminderHistoryTable;
