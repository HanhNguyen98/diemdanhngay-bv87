import { memo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import FormModal from '../../../shared/FormModal';
import { ADMIN_UI } from '../../../../constants/admin';

/**
 * Admin soft-clear day attendance — SPEC §4.11.
 */
const ClearAttendanceModal = memo(function ClearAttendanceModal({
  staff,
  date,
  reportSubmitted = false,
  onClose,
  onConfirm,
  loading,
}) {
  const { dashboard: d } = ADMIN_UI;
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const code =
    staff?.empCodeFormatted ||
    (staff?.empCode != null ? String(staff.empCode).padStart(5, '0') : '—');
  const name = staff?.fullname || '—';
  const subtitle = `${code} - ${name}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError(d.clearAttendanceNeedReason);
      return;
    }
    setError('');
    try {
      await onConfirm({ empCode: staff.empCode, date, reason: trimmed });
    } catch (err) {
      setError(err.message || d.clearAttendanceError);
    }
  };

  return (
    <FormModal
      title={d.clearAttendanceTitle}
      subtitle={subtitle}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
      submitLabel={loading ? 'Đang lưu...' : d.clearAttendanceSubmit}
      centerMobile
    >
      <div className="rounded-xl border border-primary/20 bg-primary-light px-3 py-2.5 border-l-4 border-l-primary">
        <p className="text-xs leading-relaxed text-content-heading">{d.clearAttendanceHint}</p>
      </div>

      {reportSubmitted ? (
        <div
          className="rounded-xl border border-warning-fg/30 bg-warning px-3 py-2.5 flex gap-2 items-start"
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 text-warning-fg shrink-0 mt-0.5" aria-hidden />
          <p className="text-xs leading-relaxed text-navy">{d.clearAttendanceAfterSubmitWarn}</p>
        </div>
      ) : null}

      <label className="block min-w-0">
        <span className="text-xs font-medium text-content-muted">{d.clearAttendanceReason}</span>
        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError('');
          }}
          disabled={loading}
          rows={3}
          maxLength={255}
          placeholder={d.clearAttendanceReasonPlaceholder}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:bg-neutral resize-none"
        />
      </label>

      {error && (
        <p className="text-xs text-danger-fg bg-danger/40 rounded-lg px-2.5 py-1.5">{error}</p>
      )}
    </FormModal>
  );
});

export default ClearAttendanceModal;
