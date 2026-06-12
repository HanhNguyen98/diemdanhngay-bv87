import { memo } from 'react';
import { Download } from 'lucide-react';
import {
  STATISTICS_HISTORY_COLUMNS,
  STATISTICS_UI,
  UI,
} from '../../../constants/attendance';
import DesktopPagination from '../../shared/DesktopPagination';
import AttendanceHistoryRow from '../table/AttendanceHistoryRow';

const AttendanceHistoryTable = memo(function AttendanceHistoryTable({
  items,
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  loading,
  exporting,
  onExport,
  showPagination = true,
}) {
  const colCount = STATISTICS_HISTORY_COLUMNS.length;

  return (
    <section
      className="hidden lg:flex shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-col"
      aria-label={STATISTICS_UI.historyTitle}
    >
      <div className="shrink-0 px-4 py-2 border-b border-slate-200 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-content-heading truncate">{STATISTICS_UI.historyTitle}</h2>
        <button
          type="button"
          onClick={onExport}
          disabled={exporting || totalItems === 0}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-200 text-sm font-medium text-primary hover:bg-slate-50 bg-white transition-colors disabled:opacity-50 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          {STATISTICS_UI.exportExcel}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed text-sm">
          <colgroup>
            {STATISTICS_HISTORY_COLUMNS.map((col) => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
          </colgroup>
          <thead>
            <tr className="table-header-row">
              {STATISTICS_HISTORY_COLUMNS.map((col) => {
                const thClass =
                  col.align === 'right' ? 'table-th-right' : col.align === 'center' ? 'table-th-center' : 'table-th-left';
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
            {loading ? (
              <tr>
                <td colSpan={colCount} className="py-16 text-center text-content-muted animate-pulse">
                  {UI.loading}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="py-16 text-center text-content-muted text-sm">
                  {STATISTICS_UI.noHistory}
                </td>
              </tr>
            ) : (
              items.map((item) => <AttendanceHistoryRow key={item.recordId} item={item} />)
            )}
          </tbody>
        </table>
      </div>

      {showPagination && !loading && totalItems > 0 && (
        <DesktopPagination
          embedded
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
          formatShowing={STATISTICS_UI.showingResults}
        />
      )}
    </section>
  );
});

export default AttendanceHistoryTable;
