import { memo } from 'react';
import { QUICK_ACTIONS, STATUS_BADGE, isAttendanceUnchecked } from '../../../constants/attendance';
import { DiHocIcon } from '../../shared/DiHocIcon';
import { IconBriefcase, IconCheck, IconX } from '../../icons/Icons';

const QUICK_ICONS = {
  check: IconCheck,
  x: IconX,
  graduation: DiHocIcon,
  briefcase: IconBriefcase,
};

const QUICK_BTN_ACTIVE = {
  green: 'border-green-600 bg-green-600 text-white shadow-sm',
  red: 'border-red-500 bg-red-500 text-white shadow-sm',
  yellow: 'border-orange-500 bg-orange-500 text-white shadow-sm',
  blue: 'border-blue-600 bg-blue-600 text-white shadow-sm',
};

const QUICK_BTN_OUTLINE = {
  green: 'border-green-200 bg-white text-green-500 hover:border-green-300 hover:bg-green-50',
  red: 'border-red-200 bg-white text-red-400 hover:border-red-300 hover:bg-red-50',
  yellow: 'border-orange-200 bg-white text-orange-400 hover:border-orange-300 hover:bg-orange-50',
  blue: 'border-blue-200 bg-white text-blue-500 hover:border-blue-300 hover:bg-blue-50',
};

const BTN_BASE =
  'w-9 h-9 rounded-lg border flex items-center justify-center transition-colors shrink-0';

const QuickActionGroup = memo(function QuickActionGroup({ staff, disabled, onQuickAction }) {
  const isUnchecked = isAttendanceUnchecked(staff);

  const getButtonClass = (colorKey, isActive) => {
    if (disabled) {
      return `${BTN_BASE} border-slate-300 bg-slate-200 text-slate-500 cursor-not-allowed`;
    }
    if (isActive) {
      return `${BTN_BASE} ${QUICK_BTN_ACTIVE[colorKey]}`;
    }
    if (isUnchecked) {
      return `${BTN_BASE} border-slate-200 bg-white text-slate-400 hover:bg-slate-50`;
    }
    return `${BTN_BASE} ${QUICK_BTN_OUTLINE[colorKey]}`;
  };

  return (
    <div
      className="inline-flex items-center justify-end gap-2 ml-auto"
      role="group"
      aria-label="Thao tác chấm công nhanh"
    >
      {QUICK_ACTIONS.map(({ value, color, icon, label }) => {
        const Icon = QUICK_ICONS[icon];
        const isActive = Boolean(!isAttendanceUnchecked(staff) && staff.status === value);

        return (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => onQuickAction(staff.empCode, value)}
            className={getButtonClass(color, isActive)}
            title={STATUS_BADGE[value]?.label || label}
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
