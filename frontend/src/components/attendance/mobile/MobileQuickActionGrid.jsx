import { memo } from 'react';
import { isAttendanceUnchecked } from '../../../constants/attendance';
import { useAttendanceStatusConfig } from '../../../context/AttendanceStatusContext';
import { resolveStatusQuickIcon } from '../../../utils/statusIcons';

const QUICK_BTN_ACTIVE = {
  green: 'border-success-fg bg-success-fg text-white',
  red: 'border-danger-fg bg-danger-fg text-white',
  yellow: 'border-warning-fg bg-warning-fg text-white',
  blue: 'border-info-fg bg-info-fg text-white',
  purple: 'border-violet-600 bg-violet-600 text-white',
  teal: 'border-teal-600 bg-teal-600 text-white',
  amber: 'border-warning-fg bg-warning-fg text-white',
};

const QUICK_BTN_OUTLINE = {
  green: 'border-success bg-surface-white text-success-fg hover:bg-success',
  red: 'border-danger bg-surface-white text-danger-fg hover:bg-danger',
  yellow: 'border-warning bg-surface-white text-warning-fg hover:bg-warning',
  blue: 'border-info bg-surface-white text-info-fg hover:bg-info',
  purple: 'border-violet-200 bg-surface-white text-violet-600 hover:bg-violet-50',
  teal: 'border-teal-200 bg-surface-white text-teal-600 hover:bg-teal-50',
  amber: 'border-warning bg-surface-white text-warning-fg hover:bg-warning',
};

const BTN_LAYOUT_CLASS =
  'flex flex-col items-center rounded-lg border py-2 px-1 min-h-[4.5rem] transition-colors';

const ICON_SLOT_CLASS = 'flex h-5 w-full items-center justify-center shrink-0';

/** Two-line label slot — keeps icons/text aligned across a 3-column row. */
const LABEL_SLOT_CLASS =
  'mt-1 flex min-h-[2rem] w-full items-center justify-center px-0.5 text-center text-4xs font-medium leading-tight line-clamp-2';

const MobileQuickActionGrid = memo(function MobileQuickActionGrid({ staff, disabled, onQuickAction }) {
  const { quickActions, statusBadge, statusOptions } = useAttendanceStatusConfig();
  const isUnchecked = isAttendanceUnchecked(staff);

  const getLabel = (value) => statusOptions.find((o) => o.value === value)?.label || value;

  const resolveBtnClass = (color, isActive) => {
    if (disabled) {
      return `${BTN_LAYOUT_CLASS} border-line bg-neutral text-content-muted cursor-not-allowed`;
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
      className="grid grid-cols-3 gap-2 mt-2.5"
      role="group"
      aria-label="Điểm danh nhanh"
    >
      {quickActions.map(({ value, color, icon }) => {
        const Icon = resolveStatusQuickIcon(icon);
        const isActive = Boolean(!isAttendanceUnchecked(staff) && staff.status === value);

        return (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => onQuickAction(staff.empCode, value)}
            className={resolveBtnClass(color, isActive)}
            aria-pressed={isActive}
            title={statusBadge[value]?.label || getLabel(value)}
          >
            <span className={ICON_SLOT_CLASS}>
              <Icon className="w-[1.125rem] h-[1.125rem] shrink-0" aria-hidden="true" />
            </span>
            <span className={LABEL_SLOT_CLASS}>{getLabel(value)}</span>
          </button>
        );
      })}
    </div>
  );
});

export default MobileQuickActionGrid;
