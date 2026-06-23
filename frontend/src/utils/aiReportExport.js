import { AI_ASSISTANT_UI } from '../constants/aiAssistant';
import { downloadExcel } from './exportExcel';
import { countFromBreakdown, normalizeStatusBreakdown } from './statusBreakdown';

const w = AI_ASSISTANT_UI.widgets;

function excelFilename(payload, fallback) {
  const name = payload?.filename || fallback;
  return name.replace(/\.csv$/i, '.xlsx');
}

function resolveColumns(payload) {
  const fromPayload = normalizeStatusBreakdown(payload?.statusColumns);
  if (fromPayload.length) return fromPayload;

  const map = new Map();
  (payload?.rows ?? []).forEach((row) => {
    normalizeStatusBreakdown(row.statusBreakdown).forEach((item) => {
      if (!map.has(item.code)) map.set(item.code, item);
    });
  });
  return [...map.values()];
}

export function downloadWorkStatusExcel(payload) {
  const columns = resolveColumns(payload);
  const headers = [w.colDept, ...columns.map((col) => col.label), w.colUnchecked];
  const rows = (payload?.rows || []).map((row) => [
    `[${row.deptCodeFormatted}] ${row.deptName}`,
    ...columns.map((col) => countFromBreakdown(row.statusBreakdown, col.code)),
    row.unchecked ?? 0,
  ]);

  downloadExcel({
    filename: excelFilename(payload, 'bao-cao-lam-viec.xlsx'),
    sheetName: 'Làm việc',
    headers,
    rows,
  });
}

export function downloadAttendanceStatusExcel(payload) {
  const columns = resolveColumns(payload);
  const headers = [
    w.colDept,
    ...columns.map((col) => col.label),
    w.colUnchecked,
    w.colProgress,
    w.colStatus,
  ];
  const rows = (payload?.rows || []).map((row) => [
    `[${row.deptCodeFormatted}] ${row.deptName}`,
    ...columns.map((col) => countFromBreakdown(row.statusBreakdown, col.code)),
    row.unchecked ?? 0,
    `${row.progressPercent}%`,
    row.completionLabel,
  ]);

  downloadExcel({
    filename: excelFilename(payload, 'bao-cao-cham-cong.xlsx'),
    sheetName: 'Điểm danh',
    headers,
    rows,
  });
}

export function downloadAiReportExcel(payload) {
  if (payload?.fromDate != null) {
    downloadWorkStatusExcel(payload);
    return;
  }
  if (payload?.date != null) {
    downloadAttendanceStatusExcel(payload);
  }
}
