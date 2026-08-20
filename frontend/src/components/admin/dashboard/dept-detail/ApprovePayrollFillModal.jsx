import { memo, useState } from 'react';
import { Info, UserRound, X } from 'lucide-react';
import { FormFieldLabel } from '../../../shared/FormFieldLabel';
import { UI } from '../../../../constants/attendance';

/**
 * Admin approves official payroll time fill — SPEC P8-NghiTrucWizard.
 */
const ApprovePayrollFillModal = memo(function ApprovePayrollFillModal({
  staff,
  date,
  onClose,
  onConfirm,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!staff) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onConfirm({ empCode: staff.empCode, date });
      onClose();
    } catch (err) {
      setError(err.message || 'Không duyệt được bổ sung giờ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="bg-surface-white shadow-panel w-full max-w-lg flex flex-col overflow-hidden rounded-2xl border border-line">
        <div className="shrink-0 px-5 py-3.5 border-b border-line flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-navy">{UI.payrollFillApproveTitle}</h2>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-content-heading min-w-0">
              <UserRound className="w-4 h-4 text-primary shrink-0" aria-hidden />
              <span className="truncate font-medium">
                {staff.fullname}
                <span className="text-content-muted font-normal"> • {staff.empCodeFormatted}</span>
              </span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 text-content-muted" aria-label="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-primary-light pl-3.5 pr-3.5 py-3">
            <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary" aria-hidden />
            <div className="flex gap-2.5 pl-1.5">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <p className="text-xs leading-relaxed text-content-heading">{UI.payrollFillApproveHint}</p>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-neutral/60 px-3.5 py-3 space-y-1">
            <FormFieldLabel>Loại nghỉ trực</FormFieldLabel>
            <p className="text-sm font-semibold text-info-fg">{staff.payrollIntentLabel || '—'}</p>
            <FormFieldLabel className="mt-2">Lý do Trưởng đơn vị</FormFieldLabel>
            <p className="text-sm text-content-heading">{staff.missingPunchReason || '—'}</p>
          </div>

          {error ? <p className="text-sm text-danger-fg" role="alert">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-4 rounded-lg border border-primary text-sm text-primary hover:bg-primary-light disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 rounded-lg btn-primary text-sm disabled:opacity-60"
            >
              {loading ? UI.loading : UI.payrollFillApproveSubmit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default ApprovePayrollFillModal;
