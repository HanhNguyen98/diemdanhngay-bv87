import { memo } from 'react';
import {
  ATTENDANCE_STATUS,
  getQuickActionShortLabel,
  isAttendanceBlank,
  isPostScanOverrideAction,
} from '../../../constants/attendance';
import { useAttendanceStatusConfig } from '../../../context/AttendanceStatusContext';
import { resolveStatusQuickIcon } from '../../../utils/statusIcons';

const QUICK_BTN_ACTIVE = {
  green: 'border-success-fg bg-success-fg text-white shadow-sm',
  red: 'border-danger-fg bg-danger-fg text-white shadow-sm',
  yellow: 'border-warning-fg bg-warning-fg text-white shadow-sm',
  blue: 'border-info-fg bg-info-fg text-white shadow-sm',
  purple: 'border-violet-600 bg-violet-600 text-white shadow-sm',
  teal: 'border-teal-600 bg-teal-600 text-white shadow-sm',
  amber: 'border-warning-fg bg-warning-fg text-white shadow-sm',
  indigo: 'border-indigo-600 bg-indigo-600 text-white shadow-sm',
  cyan: 'border-cyan-600 bg-cyan-600 text-white shadow-sm',
};

const QUICK_BTN_OUTLINE = {
  green: 'border-success bg-white text-success-fg hover:border-success-fg hover:bg-success',
  red: 'border-danger bg-white text-danger-fg hover:border-danger-fg hover:bg-danger',
  yellow: 'border-warning bg-white text-warning-fg hover:border-warning-fg hover:bg-warning',
  blue: 'border-info bg-white text-info-fg hover:border-info-fg hover:bg-info',
  purple: 'border-violet-200 bg-white text-violet-600 hover:border-violet-300 hover:bg-violet-50',
  teal: 'border-teal-200 bg-white text-teal-600 hover:border-teal-300 hover:bg-teal-50',
  amber: 'border-warning bg-white text-warning-fg hover:border-warning-fg hover:bg-warning',
  indigo: 'border-indigo-200 bg-white text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50',
  cyan: 'border-cyan-200 bg-white text-cyan-600 hover:border-cyan-300 hover:bg-cyan-50',
};

/** P6-HeadQuickLabel — icon + short label, visible without hover */
const BTN_BASE =
  'min-w-[3.25rem] max-w-[4.25rem] px-1 py-1 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-colors shrink-0';

const LABEL_CLASS = 'w-full truncate text-center text-4xs font-medium leading-none';

/** P6-QuickParentUx — parent button active when child status assigned */
function isQuickActionActive(staff, action) {
  if (isAttendanceBlank(staff) || !staff.status) return false;
  if (staff.status === action.value) return true;
  return (action.statusOptions || []).some((opt) => opt.value === staff.status);
}

const QuickActionGroup = memo(function QuickActionGroup({
  staff,
  disabled,
  onQuickAction,
  /** SPEC §3.2.1 — HEAD locks; Admin may open range to overwrite presence */
  lockFingerprintPresence = true,
}) {
  const { quickActions, statusBadge } = useAttendanceStatusConfig();
  const isUnchecked = isAttendanceBlank(staff);
  // SPEC §4.8 — cannot overwrite fingerprint presence via HEAD quick-action
  const fingerprintLocked =
    lockFingerprintPresence &&
    (staff?.status === ATTENDANCE_STATUS.DI_LAM || staff?.status === ATTENDANCE_STATUS.DI_TRE);

  const getButtonClass = (colorKey, isActive, actionDisabled) => {
    if (actionDisabled) {
      return `${BTN_BASE} border-line bg-neutral text-content-muted cursor-not-allowed`;
    }
    if (isActive) {
      return `${BTN_BASE} ${QUICK_BTN_ACTIVE[colorKey] || QUICK_BTN_ACTIVE.blue}`;
    }
    if (isUnchecked) {
      return `${BTN_BASE} border-line bg-surface-white text-content-muted hover:bg-neutral`;
    }
    return `${BTN_BASE} ${QUICK_BTN_OUTLINE[colorKey] || QUICK_BTN_OUTLINE.blue}`;
  };

  return (
    <div
      className="inline-flex flex-wrap items-center justify-end gap-1.5 ml-auto"
      role="group"
      aria-label="Thao tác Chấm công nhanh"
    >
      {quickActions.map((action) => {
        const { value, color, icon, label } = action;
        const Icon = resolveStatusQuickIcon(icon);
        const isActive = isQuickActionActive(staff, action);
        const actionDisabled = disabled || (fingerprintLocked && !isPostScanOverrideAction(action));
        const fullLabel = statusBadge[value]?.label || label || value;
        const shortLabel = getQuickActionShortLabel(value, label || fullLabel);
        const titleText =
          actionDisabled && fingerprintLocked
            ? 'Nhân viên đã Chấm công bằng vân tay. Không được gán trạng thái khác.'
            : fullLabel;

        return (
          <button
            key={value}
            type="button"
            disabled={actionDisabled}
            onClick={() => onQuickAction(staff.empCode, action)}
            className={getButtonClass(color, isActive, actionDisabled)}
            title={titleText}
            aria-label={titleText}
            aria-pressed={isActive}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className={LABEL_CLASS}>{shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
});

export default QuickActionGroup;
