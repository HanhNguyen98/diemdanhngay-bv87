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
  indigo: 'border-indigo-600 bg-indigo-600 text-white',
  cyan: 'border-cyan-600 bg-cyan-600 text-white',
};

const QUICK_BTN_OUTLINE = {
  green: 'border-success bg-surface-white text-success-fg hover:bg-success',
  red: 'border-danger bg-surface-white text-danger-fg hover:bg-danger',
  yellow: 'border-warning bg-surface-white text-warning-fg hover:bg-warning',
  blue: 'border-info bg-surface-white text-info-fg hover:bg-info',
  purple: 'border-info bg-surface-white text-info-fg hover:bg-info',
  teal: 'border-info bg-surface-white text-info-fg hover:bg-info',
  amber: 'border-warning bg-surface-white text-warning-fg hover:bg-warning',
  indigo: 'border-indigo-200 bg-surface-white text-indigo-600 hover:bg-indigo-50',
  cyan: 'border-cyan-200 bg-surface-white text-cyan-600 hover:bg-cyan-50',
};

/** SPEC_HEAD §6.4 — compact 2×2 cells on ~390px. */
const BTN_LAYOUT_CLASS =
  'flex min-h-[3.75rem] min-w-0 flex-col items-center justify-center rounded-lg border px-1 py-1.5 transition-colors';

/** Admin Chi tiết Đơn vị mobile — SPEC_ADMIN §6.4 P6-DeptMobile. */
const BTN_LAYOUT_CLASS_DENSE =
  'flex min-h-[2.625rem] min-w-0 flex-col items-center justify-center rounded-md border px-0.5 py-1 transition-colors';

const ICON_SLOT_CLASS = 'flex h-5 w-full shrink-0 items-center justify-center';

const ICON_SLOT_CLASS_DENSE = 'flex h-4 w-full shrink-0 items-center justify-center';

const LABEL_SLOT_CLASS =
  'mt-0.5 flex min-h-[1.75rem] w-full items-center justify-center px-0.5 text-center text-4xs font-medium leading-tight line-clamp-2';

const LABEL_SLOT_CLASS_DENSE =
  'mt-0.5 w-full truncate px-0.5 text-center text-4xs font-medium leading-none';

function isQuickActionActive(staff, action) {
  if (isAttendanceBlank(staff) || !staff.status) return false;
  if (staff.status === action.value) return true;
  return (action.statusOptions || []).some((opt) => opt.value === staff.status);
}

const MobileQuickActionGrid = memo(function MobileQuickActionGrid({
  staff,
  disabled,
  onQuickAction,
  lockFingerprintPresence = true,
  dense = false,
}) {
  const { quickActions, statusBadge } = useAttendanceStatusConfig();
  const isUnchecked = isAttendanceBlank(staff);
  const fingerprintLocked =
    lockFingerprintPresence &&
    (staff?.status === ATTENDANCE_STATUS.DI_LAM || staff?.status === ATTENDANCE_STATUS.DI_TRE);

  // P6-QuickParentUx — prefer action.label / badge (group parents are not in statusOptions)
  const getLabel = (action) =>
    action.label || statusBadge[action.value]?.label || action.value;

  const btnLayoutClass = dense ? BTN_LAYOUT_CLASS_DENSE : BTN_LAYOUT_CLASS;
  const iconSlotClass = dense ? ICON_SLOT_CLASS_DENSE : ICON_SLOT_CLASS;
  const labelSlotClass = dense ? LABEL_SLOT_CLASS_DENSE : LABEL_SLOT_CLASS;
  const iconSizeClass = dense ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4 shrink-0';
  const gridClass =
    dense && quickActions.length > 4 ? 'grid-cols-3 gap-1' : dense ? 'grid-cols-2 gap-1' : 'grid-cols-2 gap-1.5';
  const gridMargin = dense ? 'mt-1.5' : 'mt-2.5';

  const resolveBtnClass = (color, isActive, actionDisabled) => {
    if (actionDisabled) {
      return `${btnLayoutClass} cursor-not-allowed border-line bg-neutral text-content-muted`;
    }
    if (isActive) {
      return `${btnLayoutClass} ${QUICK_BTN_ACTIVE[color] || QUICK_BTN_ACTIVE.blue}`;
    }
    if (isUnchecked) {
      return `${btnLayoutClass} border-line bg-surface-white text-content-muted hover:bg-neutral`;
    }
    return `${btnLayoutClass} ${QUICK_BTN_OUTLINE[color] || QUICK_BTN_OUTLINE.blue}`;
  };

  return (
    <div className={`${gridMargin} grid ${gridClass}`} role="group" aria-label="Chấm công nhanh">
      {quickActions.map((action) => {
        const { value, color, icon } = action;
        const Icon = resolveStatusQuickIcon(icon);
        const isActive = isQuickActionActive(staff, action);
        const actionDisabled = disabled || (fingerprintLocked && !isPostScanOverrideAction(action));
        const label = getLabel(action);

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
                : label
            }
          >
            <span className={iconSlotClass}>
              <Icon className={iconSizeClass} aria-hidden="true" />
            </span>
            <span className={labelSlotClass}>{label}</span>
          </button>
        );
      })}
    </div>
  );
});

export default MobileQuickActionGrid;
