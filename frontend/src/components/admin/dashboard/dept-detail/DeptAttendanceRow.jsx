import { memo } from 'react';
import {
  MANUAL_ATTENDANCE_STATUSES,
  MANUAL_SCHEDULE_UI,
  UI,
  isMissingCheckout,
} from '../../../../constants/attendance';
import { formatInstantHm } from '../../../../utils/formatters';
import QuickActionGroup from '../../../attendance/table/QuickActionGroup';
import StaffAvatar from '../../../attendance/table/StaffAvatar';
import StatusBadge from '../../../attendance/table/StatusBadge';
import DeptFingerprintActionsMenu from './DeptFingerprintActionsMenu';

const DeptAttendanceRow = memo(function DeptAttendanceRow({
  staff,
  onOpenScanLogs,
  onOpenManualSchedule,
  onFillTimes,
  onQuickAction,
  onClearAttendance,
}) {
  const isManualLeave = MANUAL_ATTENDANCE_STATUSES.includes(staff.status);
  const canFillTimes = !isManualLeave && (!staff.checkInAt || !staff.checkOutAt);
  const canClear =
    staff.status != null || staff.checkInAt != null || staff.checkOutAt != null;
  const missingOut = isMissingCheckout(staff);

  return (
    <tr className="transition-colors hover:bg-slate-50/60">
      <td className="py-4 px-4 text-sm text-primary font-medium tabular-nums">
        {staff.empCodeFormatted}
      </td>
      <td className="py-3 px-4 align-middle">
        <div className="flex items-center gap-3 min-w-0">
          <StaffAvatar staff={staff} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{staff.fullname}</p>
            <p className="text-xs text-content-muted truncate mt-0.5">
              {staff.positionName || UI.emptyCell}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 align-middle text-sm tabular-nums text-navy font-medium">
        {formatInstantHm(staff.checkInAt) || UI.emptyCell}
      </td>
      <td className="py-3 px-4 align-middle text-sm tabular-nums text-navy font-medium">
        <div>
          {formatInstantHm(staff.checkOutAt) || UI.emptyCell}
          {missingOut ? (
            <p className="text-3xs font-medium text-warning-fg mt-0.5">{UI.missingCheckoutHint}</p>
          ) : null}
        </div>
      </td>
      <td className="py-3 px-4 align-middle">
        <StatusBadge staff={staff} />
      </td>
      <td className="py-3 px-4 align-middle text-right">
        <div className="inline-flex flex-col items-end gap-1.5">
          <QuickActionGroup
            staff={staff}
            lockFingerprintPresence={false}
            onQuickAction={onQuickAction}
          />
          <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
            <DeptFingerprintActionsMenu
              canFillTimes={canFillTimes}
              canClear={canClear}
              onOpenScanLogs={() => onOpenScanLogs?.(staff)}
              onFillTimes={() => onFillTimes?.(staff)}
              onClearAttendance={() => onClearAttendance?.(staff)}
            />
            <button
              type="button"
              className="text-primary font-semibold text-xs"
              onClick={() => onOpenManualSchedule?.(staff)}
            >
              {MANUAL_SCHEDULE_UI.openLink}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
});

export default DeptAttendanceRow;
