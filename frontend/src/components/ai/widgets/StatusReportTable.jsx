import { AI_ASSISTANT_UI } from '../../../constants/aiAssistant';
import { countFromBreakdown, normalizeStatusBreakdown } from '../../../utils/statusBreakdown';

function resolveColumns(payload, rows) {
  const fromPayload = normalizeStatusBreakdown(payload?.statusColumns);
  if (fromPayload.length) return fromPayload;

  const map = new Map();
  (rows ?? []).forEach((row) => {
    normalizeStatusBreakdown(row.statusBreakdown).forEach((item) => {
      if (!map.has(item.code)) map.set(item.code, item);
    });
  });
  return [...map.values()];
}

function ReportTable({ title, subtitle, rows, showStatus, statusColumns }) {
  const columns = resolveColumns({ statusColumns }, rows);

  if (!rows?.length) {
    return <p className="mt-2 text-sm text-content-muted">{AI_ASSISTANT_UI.widgets.pendingEmpty}</p>;
  }

  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="px-3 py-2 border-b border-gray-100 bg-surface-page/60">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        {subtitle && <p className="text-xs text-content-muted">{subtitle}</p>}
      </div>
      <div className="overflow-x-auto max-h-48 overflow-y-auto">
        <table className="w-full text-xs min-w-[520px]">
          <thead className="sticky top-0 bg-white">
            <tr className="text-left text-content-muted border-b border-gray-100">
              <th className="py-2 px-2 font-semibold">{AI_ASSISTANT_UI.widgets.colDept}</th>
              {columns.map((col) => (
                <th key={col.code} className="py-2 px-2 font-semibold text-right">
                  {col.label}
                </th>
              ))}
              {showStatus ? (
                <>
                  <th className="py-2 px-2 font-semibold text-right">{AI_ASSISTANT_UI.widgets.colProgress}</th>
                  <th className="py-2 px-2 font-semibold">{AI_ASSISTANT_UI.widgets.colStatus}</th>
                </>
              ) : (
                <th className="py-2 px-2 font-semibold text-right">{AI_ASSISTANT_UI.widgets.colUnchecked}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.deptCode} className="border-b border-gray-50 last:border-0">
                <td className="py-2 px-2 text-gray-800 whitespace-nowrap">
                  [{row.deptCodeFormatted}] {row.deptName}
                </td>
                {columns.map((col) => (
                  <td key={col.code} className="py-2 px-2 text-right tabular-nums">
                    {countFromBreakdown(row.statusBreakdown, col.code)}
                  </td>
                ))}
                {showStatus ? (
                  <>
                    <td className="py-2 px-2 text-right tabular-nums">{row.progressPercent}%</td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-2xs font-semibold ${
                          row.completionStatus === 'COMPLETED' ? 'badge-success' : 'badge-warning'
                        }`}
                      >
                        {row.completionLabel}
                      </span>
                    </td>
                  </>
                ) : (
                  <td className="py-2 px-2 text-right tabular-nums">{row.unchecked ?? 0}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function WorkStatusReportTable({ payload }) {
  const subtitle =
    payload?.fromDateFormatted === payload?.toDateFormatted
      ? payload?.fromDateFormatted
      : `${payload?.fromDateFormatted} → ${payload?.toDateFormatted}`;
  return (
    <ReportTable
      title={payload?.title || AI_ASSISTANT_UI.widgets.statusReportTitle}
      subtitle={`${payload?.scopeLabel || ''} · ${subtitle}`}
      rows={payload?.rows}
      showStatus={false}
      statusColumns={payload?.statusColumns}
    />
  );
}

export function AttendanceStatusReportTable({ payload }) {
  return (
    <ReportTable
      title={payload?.title || AI_ASSISTANT_UI.widgets.attendanceReportTitle}
      subtitle={payload?.dateFormatted}
      rows={payload?.rows}
      showStatus
      statusColumns={payload?.statusColumns}
    />
  );
}
