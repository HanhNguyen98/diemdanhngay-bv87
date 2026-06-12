import { memo } from 'react';
import { Check } from 'lucide-react';
import { UI } from '../../constants/attendance';
import { IconSend } from '../icons/Icons';

const SendReportModal = memo(function SendReportModal({ onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        className="bg-surface-white rounded-2xl shadow-panel w-full max-w-xl p-6 text-center animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-report-title"
      >
        <div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-primary-light flex items-center justify-center">
          <IconSend className="w-6 h-6 text-primary" />
        </div>

        <h2 id="send-report-title" className="text-lg font-bold text-navy mb-2">
          {UI.sendReportModalTitle}
        </h2>

        <p className="text-sm text-content-muted mb-6 lg:whitespace-nowrap">{UI.reportConfirm}</p>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full h-11 rounded-xl bg-[#204FC2] hover:bg-[#1A42A8] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {loading ? 'Đang gửi...' : UI.sendReportButton}
            {!loading && <Check className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full h-11 rounded-xl border border-gray-200 bg-white text-navy text-sm font-medium hover:bg-neutral transition-colors disabled:opacity-60"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
});

export default SendReportModal;
