import { useState } from 'react';
import { formatDateDMY, formatDeptCode } from '../utils/formatters';
import { UI } from '../constants/attendance';
import InlineErrorBanner from './shared/InlineErrorBanner';

export default function UnlockModal({
  deptCode,
  deptName,
  date,
  title = UI.unlockModalTitle,
  body = UI.unlockModalBody,
  placeholder = UI.unlockModalPlaceholder,
  confirmLabel = 'Xác nhận',
  reasonRequired = true,
  onConfirm,
  onClose,
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (reasonRequired && !reason.trim()) {
      setError('Vui lòng nhập lý do mở khóa');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-surface-white dark:bg-dark-sidebar rounded-2xl shadow-panel w-full max-w-lg overflow-hidden">
        <div className="bg-navy px-6 py-4">
          <h2 className="text-lg font-bold text-white tracking-wide">
            {title}
          </h2>
          <p className="text-white/70 text-sm mt-1">
            Đơn vị [{formatDeptCode(deptCode)}] {deptName}
            {date ? ` — ${formatDateDMY(date)}` : ''}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-content-muted">{body}</p>

          <div>
            <label className="block text-sm font-medium text-content-muted mb-1">
              Lý do mở khóa {reasonRequired && <span className="text-danger-fg">*</span>}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full border border-line dark:border-dark-border rounded-xl px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 resize-none bg-surface-page dark:bg-dark-page"
              placeholder={placeholder}
            />
          </div>

          <InlineErrorBanner message={error} />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-line text-content-muted hover:bg-neutral transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl btn-navy disabled:opacity-60"
            >
              {loading ? 'Đang xử lý...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
