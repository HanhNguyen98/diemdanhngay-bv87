import { memo } from 'react';
import { MANUAL_SCHEDULE_UI, SCAN_LOG_UI, UI, isMissingCheckout } from '../../../constants/attendance';
import { formatInstantHm } from '../../../utils/formatters';
import StaffAvatar from '../table/StaffAvatar';
import StatusBadge from '../table/StatusBadge';
import MobileQuickActionGrid from './MobileQuickActionGrid';

/** SPEC_HEAD §6.4 — mobile attendance roster card. */
const AttendanceStaffCard = memo(function AttendanceStaffCard({
  staff,
  disabled,
  onQuickAction,
  onOpenScanLogs,
  onOpenManualSchedule,
}) {
  const missingOut = isMissingCheckout(staff);

  return (
    <article className="min-w-0 rounded-xl border border-line bg-surface-white p-2.5 shadow-sm">
      <div className="flex items-start gap-2.5">
        <StaffAvatar staff={staff} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-navy">{staff.fullname}</p>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1">
            {staff.rankName && (
              <span className="inline-flex max-w-full truncate rounded-md bg-primary-light px-1.5 py-px text-4xs font-semibold text-primary">
                {staff.rankName}
              </span>
            )}
            {staff.positionName && (
              <span className="min-w-0 truncate text-4xs text-content-muted">{staff.positionName}</span>
            )}
          </div>
          <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-content-muted">
            <span className="shrink-0">
              Vào:{' '}
              <span className="font-semibold tabular-nums text-navy">
                {formatInstantHm(staff.checkInAt) || UI.emptyCell}
              </span>
            </span>
            <span className="shrink-0">
              Ra:{' '}
              <span className="font-semibold tabular-nums text-navy">
                {formatInstantHm(staff.checkOutAt) || UI.emptyCell}
              </span>
            </span>
            <StatusBadge staff={staff} variant="card" />
          </div>
          {missingOut ? (
            <p className="mt-1 text-3xs font-medium text-warning-fg">{UI.missingCheckoutHint}</p>
          ) : null}
        </div>
      </div>

      <MobileQuickActionGrid staff={staff} disabled={disabled} onQuickAction={onQuickAction} />
      <div className="mt-1.5 flex gap-2">
        <button
          type="button"
          className="flex-1 py-1.5 text-center text-xs font-semibold text-primary"
          onClick={() => onOpenManualSchedule?.(staff)}
        >
          {MANUAL_SCHEDULE_UI.openLink}
        </button>
        <button
          type="button"
          className="flex-1 py-1.5 text-center text-xs font-semibold text-primary"
          onClick={() => onOpenScanLogs?.(staff)}
        >
          {SCAN_LOG_UI.openLink}
        </button>
      </div>
    </article>
  );
});

export default AttendanceStaffCard;
