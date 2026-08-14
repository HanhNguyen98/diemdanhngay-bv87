import { memo } from 'react';
import { ATTENDANCE_STATUS, isAttendanceBlank, isPostScanOverrideAction } from '../../../constants/attendance';
import { useAttendanceStatusConfig } from '../../../context/AttendanceStatusContext';
import { resolveStatusQuickIcon } from '../../../utils/statusIcons';

const QUICK_BTN_ACTIVE = {
  green: 'border-success-fg bg-success-fg text-white',
  red: 'border-danger-fg bg-danger-fg text-white',
  yellow: 'border-warning-fg bg-warning-fg text-white',
  blue: 'border-info-fg bg-info-fg text-white',
  purple: 'border-info-fg bg-info-fg text-white',
  teal: 'border-info-fg bg-info-fg text-white',
  amber: 'border-warning-fg bg-warning-fg text-white',
};

const QUICK_BTN_OUTLINE = {
  green: 'border-success bg-surface-white text-success-fg hover:bg-success',
  red: 'border-danger bg-surface-white text-danger-fg hover:bg-danger',
  yellow: 'border-warning bg-surface-white text-warning-fg hover:bg-warning',
  blue: 'border-info bg-surface-white text-info-fg hover:bg-info',
  purple: 'border-info bg-surface-white text-info-fg hover:bg-info',
  teal: 'border-info bg-surface-white text-info-fg hover:bg-info',
  amber: 'border-warning bg-surface-white text-warning-fg hover:bg-warning',
};

/** SPEC_HEAD §6.4 — compact 2×2 cells on ~390px. */
const BTN_LAYOUT_CLASS =
  'flex min-h-[3.75rem] min-w-0 flex-col items-center justify-center rounded-lg border px-1 py-1.5 transition-colors';

const ICON_SLOT_CLASS = 'flex h-5 w-full shrink-0 items-center justify-center';

const LABEL_SLOT_CLASS =
  'mt-0.5 flex min-h-[1.75rem] w-full items-center justify-center px-0.5 text-center text-4xs font-medium leading-tight line-clamp-2';

const MobileQuickActionGrid = memo(function MobileQuickActionGrid({
  staff,
  disabled,
  onQuickAction,
  lockFingerprintPresence = true,
}) {
  const { quickActions, statusBadge, statusOptions } = useAttendanceStatusConfig();
  const isUnchecked = isAttendanceBlank(staff);
  const fingerprintLocked =
    lockFingerprintPresence &&
    (staff?.status === ATTENDANCE_STATUS.DI_LAM || staff?.status === ATTENDANCE_STATUS.DI_TRE);

  const getLabel = (value) => statusOptions.find((o) => o.value === value)?.label || value;

  const resolveBtnClass = (color, isActive, actionDisabled) => {
    if (actionDisabled) {
      return `${BTN_LAYOUT_CLASS} cursor-not-allowed border-line bg-neutral text-content-muted`;
    }
    if (isActive) {
      return `${BTN_LAYOUT_CLASS} ${QUICK_BTN_ACTIVE[color] || QUICK_BTN_ACTIVE.blue}`;
    }
    if (isUnchecked) {
      return `${BTN_LAYOUT_CLASS} border-line bg-surface-white text-content-muted hover:bg-neutral`;
    }
    return `${BTN_LAYOUT_CLASS} ${QUICK_BTN_OUTLINE[color] || QUICK_BTN_OUTLINE.blue}`;
  };

  return (
    <div
      className="mt-2.5 grid grid-cols-2 gap-1.5"
      role="group"
      aria-label="Chấm công nhanh"
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
            className={resolveBtnClass(color, isActive, actionDisabled)}
            aria-pressed={isActive}
            title={
              actionDisabled && fingerprintLocked
                ? 'Nhân viên đã Chấm công bằng vân tay. Không được gán trạng thái khác.'
                : statusBadge[value]?.label || getLabel(value)
            }
          >
            <span className={ICON_SLOT_CLASS}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            </span>
            <span className={LABEL_SLOT_CLASS}>{getLabel(value)}</span>
          </button>
        );
      })}
    </div>
  );
});

export default MobileQuickActionGrid;
