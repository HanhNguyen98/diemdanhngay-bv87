import { memo, useMemo, useState } from 'react';
import { Info, Save, UserRound, X } from 'lucide-react';
import { FormFieldLabel } from '../shared/FormFieldLabel';
import PunchTimesCell from './table/PunchTimesCell';
import {
  NGHI_TRUC_WIZARD_OPTIONS,
  PAYROLL_INTENT,
  UI,
  isNghiTrucStatus,
} from '../../constants/attendance';
import { api } from '../../api/client';

const MAX_RANGE_DAYS = 366;
const INPUT_ERROR = 'border-danger-fg ring-1 ring-danger-fg/40';

function resolveInitialPayrollIntent(staff, hasPunches) {
  const currentIntent = staff?.payrollIntent;
  if (currentIntent === PAYROLL_INTENT.HALF_MORNING || currentIntent === PAYROLL_INTENT.HALF_AFTERNOON) {
    return currentIntent;
  }
  if (!hasPunches && currentIntent === PAYROLL_INTENT.NGHI_TRUC_FULL) {
    return currentIntent;
  }
  return hasPunches ? PAYROLL_INTENT.HALF_AFTERNOON : PAYROLL_INTENT.NGHI_TRUC_FULL;
}

function daysInclusive(from, to) {
  if (!from || !to) return 0;
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  return Math.floor((b - a) / 86400000) + 1;
}

/**
 * HEAD/Admin wizard — giải trình + chấm nghỉ trực — SPEC P8 / P10 horizontal layout.
 */
const NghiTrucAssignModal = memo(function NghiTrucAssignModal({
  staff,
  defaultDate,
  onClose,
  onAssign,
  onSaved,
}) {
  const hasPunches = Boolean(
    staff?.morningInAt || staff?.noonOutAt || staff?.afternoonInAt || staff?.afternoonOutAt,
  );
  const isReassign = isNghiTrucStatus(staff?.status);

  const [payrollIntent, setPayrollIntent] = useState(resolveInitialPayrollIntent(staff, hasPunches));
  const [reason, setReason] = useState(staff?.missingPunchReason || '');
  const [fromDate, setFromDate] = useState(defaultDate);
  const [toDate, setToDate] = useState(defaultDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const wizardOptions = useMemo(() => {
    if (hasPunches) {
      return NGHI_TRUC_WIZARD_OPTIONS.filter(
        (opt) => opt.payrollIntent !== PAYROLL_INTENT.NGHI_TRUC_FULL,
      );
    }
    return NGHI_TRUC_WIZARD_OPTIONS;
  }, [hasPunches]);

  if (!staff) {
    return null;
  }

  const validate = () => {
    const next = {};
    if (!payrollIntent) next.payrollIntent = UI.nghiTrucWizardNeedIntent;
    if (!reason.trim()) next.reason = UI.nghiTrucWizardNeedReason;
    if (!fromDate || !toDate) next.dates = UI.nghiTrucWizardNeedDates;
    else if (toDate < fromDate) next.dates = UI.manualRangeInvalidOrder;
    else if (daysInclusive(fromDate, toDate) > MAX_RANGE_DAYS) next.dates = UI.manualRangeTooLong;
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      setError(Object.values(next)[0]);
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const assign = onAssign || api.assignNghiTrucWizard;
      const result = await assign({
        empCode: staff.empCode,
        fromDate,
        toDate,
        reason: reason.trim(),
        payrollIntent,
      });
      await onSaved?.(result);
      onClose();
    } catch (err) {
      setError(err.message || UI.nghiTrucWizardNeedReason);
    } finally {
      setLoading(false);
    }
  };

  const selectedLabel = NGHI_TRUC_WIZARD_OPTIONS.find(
    (o) => o.payrollIntent === payrollIntent,
  )?.label;

  const hintText = isReassign ? UI.nghiTrucWizardReassignHint : UI.nghiTrucWizardHint;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-3 py-4 sm:px-4 sm:py-6">
      <div className="bg-surface-white shadow-panel w-full max-w-lg lg:max-w-4xl flex flex-col overflow-hidden rounded-2xl animate-fade-in border border-line">
        <div className="shrink-0 px-4 py-3 lg:px-5 lg:py-3 border-b border-line flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-navy">{UI.nghiTrucWizardTitle}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-content-heading min-w-0">
              <UserRound className="w-4 h-4 text-primary shrink-0" aria-hidden />
              <span className="truncate font-medium">
                {staff.fullname}
                <span className="text-content-muted font-normal"> • {staff.empCodeFormatted}</span>
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-content-muted hover:text-gray-800"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-4 py-3 lg:px-5 lg:py-4 space-y-3 lg:space-y-3 max-lg:max-h-[min(70dvh,32rem)] max-lg:overflow-y-auto">
            {/* Top strip — hint + punches side by side on desktop */}
            <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch lg:gap-3">
              <div className="relative flex-1 overflow-hidden rounded-xl border border-primary/25 bg-primary-light pl-3 pr-3 py-2.5 lg:py-2">
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary" aria-hidden />
                <div className="flex gap-2 pl-1">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
                  <p className="text-xs leading-snug text-content-heading line-clamp-3 lg:line-clamp-2">
                    {hintText}
                  </p>
                </div>
              </div>
              <div className="shrink-0 rounded-xl border border-line bg-neutral/40 px-3 py-2 lg:min-w-[11rem] lg:flex lg:flex-col lg:justify-center">
                <p className="text-3xs font-semibold uppercase tracking-wide text-content-muted mb-1">
                  Giờ hiện có
                </p>
                <PunchTimesCell staff={staff} compact />
              </div>
            </div>

            {/* Two columns — explain | assign */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 lg:items-start">
              <section className="space-y-2.5 rounded-xl border border-line p-3 lg:p-3.5">
                <p className="text-3xs font-bold uppercase tracking-wide text-navy">
                  {UI.nghiTrucWizardSectionExplain}
                </p>

                <label className="block min-w-0">
                  <FormFieldLabel required>{UI.nghiTrucWizardIntentLabel}</FormFieldLabel>
                  <select
                    value={payrollIntent}
                    onChange={(e) => {
                      setPayrollIntent(e.target.value);
                      setFieldErrors((f) => ({ ...f, payrollIntent: undefined }));
                    }}
                    disabled={loading}
                    className={`mt-1 w-full h-9 rounded-lg border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:bg-neutral ${
                      fieldErrors.payrollIntent ? INPUT_ERROR : 'border-line'
                    }`}
                  >
                    {wizardOptions.map((opt) => (
                      <option key={opt.payrollIntent} value={opt.payrollIntent}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block min-w-0">
                  <FormFieldLabel required>{UI.nghiTrucWizardReasonLabel}</FormFieldLabel>
                  <textarea
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setFieldErrors((f) => ({ ...f, reason: undefined }));
                    }}
                    disabled={loading}
                    rows={2}
                    maxLength={255}
                    placeholder={UI.nghiTrucWizardReasonPlaceholder}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:bg-neutral lg:min-h-[4.5rem] ${
                      fieldErrors.reason ? INPUT_ERROR : 'border-line'
                    }`}
                  />
                  <p className="mt-1 text-3xs text-content-muted leading-snug">
                    {UI.nghiTrucWizardReasonFieldHint}
                  </p>
                </label>
              </section>

              <section className="space-y-2.5 rounded-xl border border-line p-3 lg:p-3.5">
                <p className="text-3xs font-bold uppercase tracking-wide text-navy">
                  {UI.nghiTrucWizardSectionAssign}
                </p>

                {selectedLabel ? (
                  <p className="rounded-lg bg-info px-2.5 py-1.5 text-sm font-semibold text-info-fg leading-snug">
                    {selectedLabel}
                  </p>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <label className="block min-w-0">
                    <FormFieldLabel required>{UI.manualRangeFrom}</FormFieldLabel>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setFieldErrors((f) => ({ ...f, dates: undefined }));
                      }}
                      disabled={loading}
                      className={`mt-1 w-full h-9 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:bg-neutral ${
                        fieldErrors.dates ? INPUT_ERROR : 'border-line'
                      }`}
                    />
                  </label>
                  <label className="block min-w-0">
                    <FormFieldLabel required>{UI.manualRangeTo}</FormFieldLabel>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => {
                        setToDate(e.target.value);
                        setFieldErrors((f) => ({ ...f, dates: undefined }));
                      }}
                      disabled={loading}
                      className={`mt-1 w-full h-9 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:bg-neutral ${
                        fieldErrors.dates ? INPUT_ERROR : 'border-line'
                      }`}
                    />
                  </label>
                </div>
              </section>
            </div>
          </div>

          <div className="shrink-0 border-t border-line bg-surface-white px-4 py-3 lg:px-5">
            {error ? (
              <p className="mb-2 text-xs text-danger-fg" role="alert">{error}</p>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-9 px-4 rounded-lg border border-primary text-sm font-medium text-primary hover:bg-primary-light disabled:opacity-60"
              >
                {UI.nghiTrucWizardCancel}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg btn-primary text-sm disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" aria-hidden />
                {loading ? UI.loading : UI.nghiTrucWizardSubmit}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});

export default NghiTrucAssignModal;
