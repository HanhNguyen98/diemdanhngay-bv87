import { memo, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import FormModal from '../shared/FormModal';
import { UI } from '../../constants/attendance';
import { api } from '../../api/client';

const MAX_RANGE_DAYS = 366;

function daysInclusive(from, to) {
  if (!from || !to) return 0;
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  return Math.floor((b - a) / 86400000) + 1;
}

/**
 * Modal: assign manual attendance status for fromDate → toDate (SPEC §3.2.1).
 * HEAD: preview warns when fingerprint days will be skipped (no overwrite).
 */
const ManualStatusRangeModal = memo(function ManualStatusRangeModal({
  staff,
  status,
  statusLabel,
  defaultDate,
  onConfirm,
  onClose,
  loading,
}) {
  const [fromDate, setFromDate] = useState(defaultDate);
  const [toDate, setToDate] = useState(defaultDate);
  const [error, setError] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [skipWarning, setSkipWarning] = useState(null);

  const dayCount = useMemo(() => daysInclusive(fromDate, toDate), [fromDate, toDate]);
  const busy = loading || previewing;

  const code = staff?.empCodeFormatted || (staff?.empCode != null ? String(staff.empCode).padStart(5, '0') : '—');
  const name = staff?.fullname || '—';
  const subtitle = `${code} - ${name}`;

  const validateDates = () => {
    if (!fromDate || !toDate) {
      setError('Vui lòng chọn đủ Từ ngày và Đến ngày.');
      return false;
    }
    if (toDate < fromDate) {
      setError(UI.manualRangeInvalidOrder);
      return false;
    }
    if (dayCount > MAX_RANGE_DAYS) {
      setError(UI.manualRangeTooLong);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSkipWarning(null);
    if (!validateDates()) return;

    setPreviewing(true);
    try {
      const preview = await api.previewAttendanceManualRange({
        empCode: staff.empCode,
        fromDate,
        toDate,
      });
      if (preview.requiresFingerprintSkipConfirm) {
        setSkipWarning({
          message:
            preview.message ||
            `Có ${preview.skippedFingerprint} ngày đã chấm bằng vân tay — sẽ được bỏ qua (không ghi đè). Tiếp tục?`,
        });
        return;
      }
      onConfirm({ fromDate, toDate });
    } catch (err) {
      setError(err.message || 'Không kiểm tra được khoảng ngày.');
    } finally {
      setPreviewing(false);
    }
  };

  const handleContinueSkip = () => {
    setSkipWarning(null);
    onConfirm({ fromDate, toDate });
  };

  const handleDismissSkip = () => {
    setSkipWarning(null);
  };

  return (
    <FormModal
      title={UI.manualRangeTitle}
      subtitle={subtitle}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={busy}
      submitLabel={busy ? UI.manualRangeSubmitting : UI.manualRangeSubmit}
      centerMobile
    >
      <div className="rounded-xl border border-line bg-neutral/40 px-3 py-2.5">
        <p className="text-xs text-content-muted">Trạng thái</p>
        <p className="text-sm font-semibold text-navy mt-0.5">{statusLabel || status}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block min-w-0">
          <span className="text-xs font-medium text-content-muted">{UI.manualRangeFrom}</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setSkipWarning(null);
            }}
            disabled={busy}
            className="mt-1 w-full h-10 rounded-lg border border-line px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:bg-neutral"
          />
        </label>
        <label className="block min-w-0">
          <span className="text-xs font-medium text-content-muted">{UI.manualRangeTo}</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setSkipWarning(null);
            }}
            disabled={busy}
            className="mt-1 w-full h-10 rounded-lg border border-line px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:bg-neutral"
          />
        </label>
      </div>

      {dayCount > 0 && toDate >= fromDate && (
        <p className="text-xs text-content-muted">
          Số ngày: <span className="font-semibold text-navy">{dayCount}</span>
        </p>
      )}

      {skipWarning && (
        <div
          className="rounded-xl border border-warning-fg/30 bg-warning px-3 py-2.5 space-y-2.5"
          role="alert"
        >
          <div className="flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 text-warning-fg shrink-0 mt-0.5" aria-hidden />
            <p className="text-sm text-navy leading-snug">{skipWarning.message}</p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleDismissSkip}
              disabled={busy}
              className="h-8 px-3 rounded-lg border border-line text-xs font-medium text-content-muted hover:bg-surface-white disabled:opacity-60"
            >
              {UI.manualRangeSkipCancel}
            </button>
            <button
              type="button"
              onClick={handleContinueSkip}
              disabled={busy}
              className="h-8 px-3 rounded-lg btn-primary text-xs font-medium disabled:opacity-60"
            >
              {UI.manualRangeSkipContinue}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-danger-fg bg-danger/40 rounded-lg px-2.5 py-1.5">{error}</p>
      )}
    </FormModal>
  );
});

export default ManualStatusRangeModal;
