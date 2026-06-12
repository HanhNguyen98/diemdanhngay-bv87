import { memo } from 'react';
import { QUICK_ACTIONS, STATUS_BADGE, STATUS_OPTIONS, isAttendanceUnchecked } from '../../../constants/attendance';
import { DiHocIcon } from '../../shared/DiHocIcon';
import { IconBriefcase, IconCheck, IconX } from '../../icons/Icons';

const QUICK_ICONS = {
  check: IconCheck,
  x: IconX,
  graduation: DiHocIcon,
  briefcase: IconBriefcase,
};

const QUICK_BTN_ACTIVE = {
  green: 'border-green-600 bg-green-600 text-white',
  red: 'border-red-500 bg-red-500 text-white',
  yellow: 'border-orange-500 bg-orange-500 text-white',
  blue: 'border-blue-600 bg-blue-600 text-white',
};

const QUICK_BTN_OUTLINE = {
  green: 'border-green-200 bg-white text-green-600 hover:bg-green-50',
  red: 'border-red-200 bg-white text-red-500 hover:bg-red-50',
  yellow: 'border-orange-200 bg-white text-orange-500 hover:bg-orange-50',
  blue: 'border-blue-200 bg-white text-blue-600 hover:bg-blue-50',
};

function getLabel(value) {
  return STATUS_OPTIONS.find((o) => o.value === value)?.label || value;
}

const MobileQuickActionGrid = memo(function MobileQuickActionGrid({ staff, disabled, onQuickAction }) {
  const isUnchecked = isAttendanceUnchecked(staff);

  return (
    <div
      className="grid grid-cols-4 gap-[clamp(0.25rem,2vw,0.5rem)] mt-3"
      role="group"
      aria-label="Chấm công nhanh"
    >
      {QUICK_ACTIONS.map(({ value, color, icon }) => {
        const Icon = QUICK_ICONS[icon];
        const isActive = Boolean(!isAttendanceUnchecked(staff) && staff.status === value);

        let btnClass =
          'flex flex-col items-center justify-center gap-1 rounded-lg border py-2 px-1 min-h-[3.5rem] transition-colors';
        if (disabled) {
          btnClass += ' border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed';
        } else if (isActive) {
          btnClass += ` ${QUICK_BTN_ACTIVE[color]}`;
        } else if (isUnchecked) {
          btnClass += ' border-slate-200 bg-white text-slate-500 hover:bg-slate-50';
        } else {
          btnClass += ` ${QUICK_BTN_OUTLINE[color]}`;
        }

        return (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => onQuickAction(staff.empCode, value)}
            className={btnClass}
            aria-pressed={isActive}
            title={STATUS_BADGE[value]?.label || getLabel(value)}
          >
            <Icon className="w-[1.125rem] h-[1.125rem] shrink-0" />
            <span className="text-4xs font-medium leading-tight text-center">{getLabel(value)}</span>
          </button>
        );
      })}
    </div>
  );
});

export default MobileQuickActionGrid;
