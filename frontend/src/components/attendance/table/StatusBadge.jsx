import { memo } from 'react';
import { STATUS_BADGE, isAttendanceUnchecked } from '../../../constants/attendance';
import { DiHocIcon } from '../../shared/DiHocIcon';
import {
  IconBriefcase,
  IconCheckCircle,
  IconEllipsis,
  IconXCircle,
} from '../../icons/Icons';

const STATUS_ICONS = {
  check: IconCheckCircle,
  x: IconXCircle,
  graduation: DiHocIcon,
  briefcase: IconBriefcase,
  pending: IconEllipsis,
};

function getBadgeMeta(staff) {
  if (isAttendanceUnchecked(staff)) {
    return STATUS_BADGE.UNCHECKED;
  }
  return (
    STATUS_BADGE[staff.status] || {
      label: (staff.statusLabel || staff.status).toUpperCase(),
      className: 'badge-neutral',
      icon: 'pending',
    }
  );
}

const StatusBadge = memo(function StatusBadge({ staff }) {
  const { label, className, icon } = getBadgeMeta(staff);
  const Icon = STATUS_ICONS[icon] || IconEllipsis;

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 px-2 py-0.5 lg:gap-1.5 lg:px-3 lg:py-1 rounded-full text-[0.70rem] leading-tight lg:text-xs font-semibold whitespace-nowrap ${className}`}
      title={label}
    >
      <Icon className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </span>
  );
});

export default StatusBadge;
