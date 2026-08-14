import { memo } from 'react';
import { ATTENDANCE_STATUS, isAttendanceBlank, isPostScanOverrideAction } from '../../../constants/attendance';
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
};

const QUICK_BTN_OUTLINE = {
  green: 'border-success bg-white text-success-fg hover:border-success-fg hover:bg-success',
  red: 'border-danger bg-white text-danger-fg hover:border-danger-fg hover:bg-danger',
  yellow: 'border-warning bg-white text-warning-fg hover:border-warning-fg hover:bg-warning',
  blue: 'border-info bg-white text-info-fg hover:border-info-fg hover:bg-info',
  purple: 'border-violet-200 bg-white text-violet-600 hover:border-violet-300 hover:bg-violet-50',
  teal: 'border-teal-200 bg-white text-teal-600 hover:border-teal-300 hover:bg-teal-50',
  amber: 'border-warning bg-white text-warning-fg hover:border-warning-fg hover:bg-warning',
};

const BTN_BASE =
  'w-9 h-9 rounded-lg border flex items-center justify-center transition-colors shrink-0';

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
      className="inline-flex items-center justify-end gap-2 ml-auto"
      role="group"
      aria-label="Thao tác Chấm công nhanh"
    >
      {quickActions.map((action) => {
        const { value, color, icon } = action;
        const Icon = resolveStatusQuickIcon(icon);
        const isActive = Boolean(!isAttendanceBlank(staff) && staff.status === value);
        const actionDisabled = disabled || (fingerprintLocked && !isPostScanOverrideAction(action));

        return (
          <button
            key={value}
            type="button"
            disabled={actionDisabled}
            onClick={() => onQuickAction(staff.empCode, action)}
            className={getButtonClass(color, isActive, actionDisabled)}
            title={
              actionDisabled && fingerprintLocked
                ? 'Nhân viên đã Chấm công bằng vân tay. Không được gán trạng thái khác.'
                : statusBadge[value]?.label || value
            }
            aria-pressed={isActive}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
});

export default QuickActionGroup;
