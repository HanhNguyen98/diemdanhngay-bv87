import { memo } from 'react';
import {
  ATTENDANCE_STATUS,
  MANUAL_SCHEDULE_UI,
  UI,
  hasEmptyFourPunchSlot,
  isMissingCheckout,
} from '../../../../constants/attendance';
import { formatKioskMachine } from '../../../../utils/kioskMachine';
import PunchTimesCell from '../../../attendance/table/PunchTimesCell';
import MobileQuickActionGrid from '../../../attendance/mobile/MobileQuickActionGrid';
import StaffAvatar from '../../../attendance/table/StaffAvatar';
import StatusBadge from '../../../attendance/table/StatusBadge';
import VeSomNoteField from '../../../attendance/table/VeSomNoteField';
import DeptFingerprintActionsMenu from './DeptFingerprintActionsMenu';

const DeptAttendanceStaffCard = memo(function DeptAttendanceStaffCard({
  staff,
  onOpenScanLogs,
  onOpenManualSchedule,
  onFillTimes,
  onQuickAction,
  onClearAttendance,
  onSaveVeSomNote,
}) {
  const isManualLeave =
    staff.status != null &&
    staff.status !== ATTENDANCE_STATUS.DI_LAM &&
    staff.status !== ATTENDANCE_STATUS.DI_TRE;
  const canFillTimes = !isManualLeave && hasEmptyFourPunchSlot(staff);
  const canClear =
    staff.status != null || staff.checkInAt != null || staff.checkOutAt != null;
  const missingOut = isMissingCheckout(staff);

  return (
    <article className="rounded-lg border border-line bg-surface-page/40 px-2.5 py-2.5">
      <div className="flex items-start gap-2.5">
        <StaffAvatar staff={staff} />

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-content-heading leading-snug truncate">{staff.fullname}</p>
          <p className="mt-0.5 text-3xs text-primary font-medium tabular-nums">
            {staff.empCodeFormatted}
          </p>
          {staff.positionName && (
            <p className="mt-0.5 text-3xs text-content-muted truncate">{staff.positionName}</p>
          )}
          {!staff.positionName && (
            <p className="mt-0.5 text-3xs text-content-muted">{UI.emptyCell}</p>
          )}
          <div className="mt-1.5">
            <PunchTimesCell staff={staff} compact />
          </div>
          <p className="mt-1 text-3xs text-content-muted truncate" title={formatKioskMachine(staff)}>
            {formatKioskMachine(staff)}
          </p>
          {missingOut ? (
            <p className="mt-1 text-3xs font-medium text-warning-fg">{UI.missingCheckoutHint}</p>
          ) : null}
          {staff.status === ATTENDANCE_STATUS.VE_SOM ? (
            <div className="mt-1.5">
              <VeSomNoteField staff={staff} onSave={onSaveVeSomNote} />
            </div>
          ) : staff.note ? (
            <p className="mt-1 text-3xs text-content-muted italic truncate" title={staff.note}>
              {UI.noteLabel}: {staff.note}
            </p>
          ) : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <DeptFingerprintActionsMenu
              compact
              canFillTimes={canFillTimes}
              canClear={canClear}
              onOpenScanLogs={() => onOpenScanLogs?.(staff)}
              onFillTimes={() => onFillTimes?.(staff)}
              onClearAttendance={() => onClearAttendance?.(staff)}
            />
            <button
              type="button"
              className="text-primary font-semibold text-3xs"
              onClick={() => onOpenManualSchedule?.(staff)}
            >
              {MANUAL_SCHEDULE_UI.openLink}
            </button>
          </div>
        </div>

        <div className="shrink-0 min-w-0 max-w-[52%] flex justify-end">
          <StatusBadge staff={staff} variant="card" />
        </div>
      </div>

      <MobileQuickActionGrid
        staff={staff}
        lockFingerprintPresence={false}
        onQuickAction={onQuickAction}
      />
    </article>
  );
});

export default DeptAttendanceStaffCard;
