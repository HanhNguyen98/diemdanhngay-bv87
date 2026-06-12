import { AI_ASSISTANT_UI } from '../constants/aiAssistant';
import { downloadExcel } from './exportExcel';

const w = AI_ASSISTANT_UI.widgets;

function excelFilename(payload, fallback) {
  const name = payload?.filename || fallback;
  return name.replace(/\.csv$/i, '.xlsx');
}

export function downloadWorkStatusExcel(payload) {
  const headers = [
    w.colDept,
    w.colPresent,
    w.colLeave,
    w.colStudy,
    w.colDuty,
    w.colUnchecked,
  ];
  const rows = (payload?.rows || []).map((row) => [
    `[${row.deptCodeFormatted}] ${row.deptName}`,
    row.diLam,
    row.nghiPhep,
    row.diHoc,
    row.diCongTac,
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
  const headers = [
    w.colDept,
    w.colPresent,
    w.colLeave,
    w.colStudy,
    w.colDuty,
    w.colUnchecked,
    w.colProgress,
    w.colStatus,
  ];
  const rows = (payload?.rows || []).map((row) => [
    `[${row.deptCodeFormatted}] ${row.deptName}`,
    row.diLam,
    row.nghiPhep,
    row.diHoc,
    row.diCongTac,
    row.unchecked ?? 0,
    `${row.progressPercent}%`,
    row.completionLabel,
  ]);

  downloadExcel({
    filename: excelFilename(payload, 'bao-cao-cham-cong.xlsx'),
    sheetName: 'Chấm công',
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
