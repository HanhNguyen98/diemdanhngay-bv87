import { memo } from 'react';
import { UI, isAttendanceBlank, isNghiTrucStatus } from '../../../constants/attendance';
import { useAttendanceStatusConfig } from '../../../context/AttendanceStatusContext';
import { resolveStatusKpiIcon } from '../../../utils/statusIcons';

function getBadgeMeta(staff, statusBadge) {
  if (isAttendanceBlank(staff)) {
    return statusBadge.UNCHECKED;
  }
  return (
    statusBadge[staff.status] || {
      label: (staff.statusLabel || staff.status).toUpperCase(),
      className: 'badge-neutral',
      icon: 'pending',
    }
  );
}

function resolveCardLabel(staff, badgeMeta) {
  if (isAttendanceBlank(staff)) {
    return staff.statusLabel || UI.filterUnchecked;
  }
  return staff.statusLabel || badgeMeta.label;
}

const StatusBadge = memo(function StatusBadge({ staff, variant, compactNghiTruc = false }) {
  const { statusBadge } = useAttendanceStatusConfig();
  const badgeMeta = getBadgeMeta(staff, statusBadge);
  const { className, icon } = badgeMeta;
  const isCard = variant === 'card';
  let label = isCard ? resolveCardLabel(staff, badgeMeta) : badgeMeta.label;
  if (compactNghiTruc && isNghiTrucStatus(staff?.status)) {
    label =
      statusBadge.NGHI_TRUC?.label
      || statusBadge.NGHI_TRUC_HALF?.label?.split('·')[0]?.trim()
      || 'NGHỈ TRỰC';
  }
  const Icon = resolveStatusKpiIcon(icon);

  return (
    <span
      className={
        isCard
          ? `inline-flex max-w-full shrink-0 items-center gap-0.5 rounded-full px-1.5 py-px text-4xs font-semibold leading-tight normal-case ${className}`
          : `inline-flex max-w-full items-center gap-1 px-2 py-0.5 lg:gap-1.5 lg:px-3 lg:py-1 rounded-full text-[0.70rem] leading-tight lg:text-xs font-semibold whitespace-nowrap ${className}`
      }
      title={label}
    >
      <Icon
        className={isCard ? 'w-3 h-3 shrink-0' : 'w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0'}
        aria-hidden="true"
      />
      <span className={isCard ? 'whitespace-nowrap' : 'truncate text-3xs'}>{label}</span>
      {staff?.lateFlag && staff?.status === 'VE_SOM' ? (
        <span className="text-danger-fg font-semibold whitespace-nowrap">{UI.plusLate}</span>
      ) : null}
    </span>
  );
});

export default StatusBadge;
