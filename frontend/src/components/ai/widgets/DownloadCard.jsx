import { FileSpreadsheet, Download } from 'lucide-react';
import { AI_ASSISTANT_UI } from '../../../constants/aiAssistant';
import { downloadAiReportExcel } from '../../../utils/aiReportExport';

export default function DownloadCard({ payload }) {
  const filename = (payload?.filename || 'bao-cao.xlsx').replace(/\.csv$/i, '.xlsx');
  const title =
    payload?.title ||
    (payload?.deptName
      ? `${AI_ASSISTANT_UI.widgets.downloadTitle} — [${payload.deptCodeFormatted}] ${payload.deptName}`
      : AI_ASSISTANT_UI.widgets.downloadTitle);
  const meta = payload?.dateFormatted
    ? `Ngày ${payload.dateFormatted}`
    : payload?.fromDateFormatted
      ? `${payload.fromDateFormatted}${payload.toDateFormatted !== payload.fromDateFormatted ? ` → ${payload.toDateFormatted}` : ''}`
      : null;

  return (
    <div className="mt-2 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 leading-snug">{title}</p>
          {meta && <p className="text-xs text-content-muted mt-0.5 truncate">{meta}</p>}
          <p className="text-2xs text-content-muted truncate">{filename}</p>
          <button
            type="button"
            onClick={() => downloadAiReportExcel(payload)}
            className="mt-2.5 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {AI_ASSISTANT_UI.widgets.downloadButton}
          </button>
        </div>
      </div>
    </div>
  );
}
