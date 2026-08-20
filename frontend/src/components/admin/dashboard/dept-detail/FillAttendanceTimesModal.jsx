import { memo, useMemo, useState } from 'react';
import {
  ArrowLeftToLine,
  ArrowRightFromLine,
  CheckCircle2,
  Clock3,
  Info,
  Save,
  UserRound,
  X,
} from 'lucide-react';
import { ADMIN_UI } from '../../../../constants/admin';
import { ATTENDANCE_STATUS, STATUS_BADGE } from '../../../../constants/attendance';
import { useAppBranding } from '../../../../context/AppBrandingContext';
import { formatInstantHm } from '../../../../utils/formatters';
import biometricsImg from '../../../../assets/branding/biometrics.png';

function hmToMinutes(hm) {
  if (!hm || !/^\d{2}:\d{2}/.test(hm)) return null;
  const [h, m] = hm.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

function addMinutesHm(hm, extra) {
  const mins = hmToMinutes(hm);
  if (mins == null) return '07:05';
  const total = Math.max(0, Math.min(23 * 60 + 59, mins + (Number(extra) || 0)));
  const h = String(Math.floor(total / 60)).padStart(2, '0');
  const m = String(total % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function statusFromCheckInHm(hm, cutoffHm) {
  const mins = hmToMinutes(hm);
  const cut = hmToMinutes(cutoffHm) ?? 7 * 60 + 5;
  if (mins == null) return null;
  return mins <= cut ? ATTENDANCE_STATUS.DI_LAM : ATTENDANCE_STATUS.DI_TRE;
}

function statusBadgeLabel(code) {
  if (!code) return '';
  return STATUS_BADGE[code]?.label || code;
}

/** Progress 0–100 for rule-C bar (how late vs cutoff; capped). */
function lateProgressPercent(hm, cutoffHm) {
  const mins = hmToMinutes(hm);
  const cut = hmToMinutes(cutoffHm) ?? 7 * 60 + 5;
  if (mins == null) return 0;
  if (mins <= cut) return 28;
  const late = mins - cut;
  return Math.min(95, 40 + Math.round((late / 120) * 55));
}

/**
 * Admin fills empty check-in / check-out — SPEC §4.6 mockup 2.
 */
const FillAttendanceTimesModal = memo(function FillAttendanceTimesModal({
  staff,
  date,
  onClose,
  onSaved,
}) {
  const { dashboard: d } = ADMIN_UI;
  const { branding } = useAppBranding();
  const lateCutoffHm = addMinutesHm(
    branding?.morningInOfficial || '07:00',
    branding?.lateGraceMinutes ?? 5,
  );

  const morningLocked = Boolean(staff?.morningInAt || staff?.checkInAt);
  const noonLocked = Boolean(staff?.noonOutAt);
  const afternoonInLocked = Boolean(staff?.afternoonInAt);
  const afternoonOutLocked = Boolean(staff?.afternoonOutAt || (!staff?.noonOutAt && staff?.checkOutAt));

  const existingMorningHm = formatInstantHm(staff?.morningInAt || staff?.checkInAt);
  const existingNoonHm = formatInstantHm(staff?.noonOutAt);
  const existingAfternoonInHm = formatInstantHm(staff?.afternoonInAt);
  const existingAfternoonOutHm = formatInstantHm(
    staff?.afternoonOutAt || (!staff?.noonOutAt ? staff?.checkOutAt : null),
  );

  const [morningInTime, setMorningInTime] = useState('');
  const [noonOutTime, setNoonOutTime] = useState('');
  const [afternoonInTime, setAfternoonInTime] = useState('');
  const [afternoonOutTime, setAfternoonOutTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const effectiveInHm = morningLocked ? existingMorningHm : morningInTime || null;
  const needAny = !morningLocked || !noonLocked || !afternoonInLocked || !afternoonOutLocked;

  const preview = useMemo(() => {
    const existing = staff?.status;
    if (
      existing === ATTENDANCE_STATUS.DI_LAM ||
      existing === ATTENDANCE_STATUS.DI_TRE
    ) {
      return {
        statusText: statusBadgeLabel(existing),
        detail: d.fillTimesPreviewKeep(statusBadgeLabel(existing)),
        tone: existing === ATTENDANCE_STATUS.DI_TRE ? 'late' : 'ok',
        bar: existing === ATTENDANCE_STATUS.DI_TRE
          ? lateProgressPercent(effectiveInHm || lateCutoffHm, lateCutoffHm)
          : 28,
      };
    }
    if (effectiveInHm) {
      const code = statusFromCheckInHm(effectiveInHm, lateCutoffHm);
      return {
        statusText: statusBadgeLabel(code),
        detail: d.fillTimesPreviewRuleC(effectiveInHm.slice(0, 5), lateCutoffHm),
        tone: code === ATTENDANCE_STATUS.DI_TRE ? 'late' : 'ok',
        bar: lateProgressPercent(effectiveInHm, lateCutoffHm),
      };
    }
    return {
      statusText: d.fillTimesPreviewUnchecked,
      detail: d.fillTimesPreviewNoIn,
      tone: 'muted',
      bar: 8,
    };
  }, [staff?.status, effectiveInHm, d, lateCutoffHm]);

  if (!staff || !needAny) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const body = {
      empCode: staff.empCode,
      date,
    };
    if (!morningLocked && morningInTime) body.morningInTime = morningInTime;
    if (!noonLocked && noonOutTime) body.noonOutTime = noonOutTime;
    if (!afternoonInLocked && afternoonInTime) body.afternoonInTime = afternoonInTime;
    if (!afternoonOutLocked && afternoonOutTime) body.afternoonOutTime = afternoonOutTime;
    if (!body.morningInTime && !body.noonOutTime && !body.afternoonInTime && !body.afternoonOutTime) {
      setError(d.fillTimesNeedOne);
      return;
    }
    setLoading(true);
    try {
      await onSaved(body);
      onClose();
    } catch (err) {
      setError(err.message || d.fillTimesError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="bg-surface-white shadow-panel w-full max-w-lg max-h-[92dvh] flex flex-col overflow-hidden rounded-2xl animate-fade-in border border-line">
        <div className="shrink-0 px-5 py-3.5 border-b border-line flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-navy">{d.fillTimesTitle}</h2>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-content-heading min-w-0">
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
            <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-primary-light pl-3.5 pr-3.5 py-3">
              <span
                className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                aria-hidden
              />
              <div className="flex gap-2.5 pl-1.5">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
                <p className="text-xs leading-relaxed text-content-heading">{d.fillTimesHint}</p>
              </div>
            </div>

            {error ? (
              <p className="text-sm text-danger-fg" role="alert">
                {error}
              </p>
            ) : null}

            {staff?.missingPunchReason ? (
              <div className="rounded-xl border border-line bg-neutral/60 px-3.5 py-3 space-y-1">
                <p className="text-3xs font-bold uppercase tracking-wide text-content-muted">
                  {d.fillTimesHeadReasonTitle}
                </p>
                {staff.payrollIntentLabel ? (
                  <p className="text-xs text-info-fg font-semibold">{staff.payrollIntentLabel}</p>
                ) : null}
                <p className="text-xs text-content-heading leading-snug">{staff.missingPunchReason}</p>
              </div>
            ) : (
              <p className="text-xs text-danger-fg bg-danger/30 rounded-lg px-2.5 py-1.5">
                {d.fillTimesHeadReasonMissing}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TimeField
                label={d.fillTimesLabelMorningIn}
                LabelIcon={ArrowLeftToLine}
                locked={morningLocked}
                lockedValue={existingMorningHm}
                value={morningInTime}
                onChange={setMorningInTime}
                alreadyLabel={d.fillTimesAlreadySet}
              />
              <TimeField
                label={d.fillTimesLabelNoonOut}
                LabelIcon={ArrowRightFromLine}
                locked={noonLocked}
                lockedValue={existingNoonHm}
                value={noonOutTime}
                onChange={setNoonOutTime}
                alreadyLabel={d.fillTimesAlreadySet}
              />
              <TimeField
                label={d.fillTimesLabelAfternoonIn}
                LabelIcon={ArrowLeftToLine}
                locked={afternoonInLocked}
                lockedValue={existingAfternoonInHm}
                value={afternoonInTime}
                onChange={setAfternoonInTime}
                alreadyLabel={d.fillTimesAlreadySet}
              />
              <TimeField
                label={d.fillTimesLabelAfternoonOut}
                LabelIcon={ArrowRightFromLine}
                locked={afternoonOutLocked}
                lockedValue={existingAfternoonOutHm}
                value={afternoonOutTime}
                onChange={setAfternoonOutTime}
                alreadyLabel={d.fillTimesAlreadySet}
              />
            </div>

            <div className="rounded-xl border border-line bg-neutral/80 px-3.5 py-3">
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-3xs font-bold uppercase tracking-wide text-content-muted">
                  {d.fillTimesPreviewTitle}
                </p>
                <span className="inline-flex items-center rounded-full bg-surface-white border border-line px-2 py-0.5 text-3xs font-semibold text-neutral-fg uppercase">
                  {d.fillTimesPreviewAuto}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-12 h-12 rounded-lg bg-primary-light border border-primary/20 flex items-center justify-center overflow-hidden p-1.5">
                  <img
                    src={biometricsImg}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-content-muted">{d.fillTimesPreviewStatus}</p>
                  <p
                    className={`mt-0.5 text-sm font-bold ${preview.tone === 'late'
                      ? 'text-danger-fg'
                      : preview.tone === 'ok'
                        ? 'text-success-fg'
                        : 'text-content-muted'
                      }`}
                  >
                    {preview.statusText}
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-primary-light overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${preview.tone === 'late'
                        ? 'bg-danger-fg'
                        : preview.tone === 'ok'
                          ? 'bg-primary'
                          : 'bg-neutral-fg/40'
                        }`}
                      style={{ width: `${preview.bar}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-content-muted leading-snug">{preview.detail}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex justify-end gap-2 px-5 py-3 border-t border-line bg-surface-white">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-4 rounded-lg border border-primary text-sm font-medium text-primary hover:bg-primary-light disabled:opacity-60"
            >
              {ADMIN_UI.form.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg btn-primary text-sm disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" aria-hidden />
              {loading ? 'Đang lưu...' : d.fillTimesSubmit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

function TimeField({
  label,
  LabelIcon,
  locked,
  lockedValue,
  value,
  onChange,
  alreadyLabel,
}) {
  return (
    <div className="min-w-0">
      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-navy">
        {label}
        {LabelIcon ? <LabelIcon className="w-3.5 h-3.5 text-primary" aria-hidden /> : null}
      </span>
      {locked ? (
        <div className="relative mt-1.5">
          <input
            type="text"
            readOnly
            disabled
            value={lockedValue || '—'}
            className="w-full h-10 rounded-lg border border-line bg-primary-light/60 pl-3 pr-20 text-sm tabular-nums font-medium text-content-heading cursor-not-allowed"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-3xs font-semibold text-success-fg">
            <CheckCircle2 className="w-3 h-3" aria-hidden />
            {alreadyLabel}
          </span>
        </div>
      ) : (
        <div className="relative mt-1.5">
          <input
            type="time"
            className="w-full h-10 rounded-lg border border-primary bg-surface-white pl-3 pr-10 text-sm tabular-nums text-content-heading focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <Clock3
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary"
            aria-hidden
          />
        </div>
      )}
    </div>
  );
}

export default FillAttendanceTimesModal;
