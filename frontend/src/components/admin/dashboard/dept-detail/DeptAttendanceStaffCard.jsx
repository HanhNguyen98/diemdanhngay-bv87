import { memo } from 'react';
import {
  ATTENDANCE_STATUS,
  MANUAL_SCHEDULE_UI,
  UI,
  canAdminApprovePayrollFill,
  canAdminFillTimes,
} from '../../../../constants/attendance';
import { formatKioskMachine } from '../../../../utils/kioskMachine';
import PunchTimesCell from '../../../attendance/table/PunchTimesCell';
import StatusCell from '../../../attendance/table/StatusCell';
import MobileQuickActionGrid from '../../../attendance/mobile/MobileQuickActionGrid';
import StaffAvatar from '../../../attendance/table/StaffAvatar';
import VeSomNoteField from '../../../attendance/table/VeSomNoteField';
import DeptFingerprintActionsMenu from './DeptFingerprintActionsMenu';

/** Admin Chi tiết Đơn vị — mobile roster card (SPEC_ADMIN §6.4 P6-DeptMobile). */
const DeptAttendanceStaffCard = memo(function DeptAttendanceStaffCard({
  staff,
  onOpenScanLogs,
  onOpenManualSchedule,
  onFillTimes,
  onApprovePayrollFill,
  onQuickAction,
  onClearAttendance,
  onSaveVeSomNote,
}) {
  const canFillTimes = canAdminFillTimes(staff);
  const canApprovePayrollFill = canAdminApprovePayrollFill(staff);
  const canClear =
    staff.status != null || staff.checkInAt != null || staff.checkOutAt != null;
  const kioskLabel = formatKioskMachine(staff);

  return (
    <article className="min-w-0 rounded-lg border border-line bg-surface-white px-2 py-2 shadow-sm">
      <div className="flex items-start gap-2">
        <StaffAvatar staff={staff} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-navy leading-snug">{staff.fullname}</p>
          <p className="mt-0.5 text-4xs font-medium text-primary tabular-nums">{staff.empCodeFormatted}</p>
          {staff.positionName ? (
            <p className="mt-0.5 truncate text-4xs text-content-muted">{staff.positionName}</p>
          ) : null}

          <div className="mt-1 flex min-w-0 flex-wrap items-start gap-x-2 gap-y-0.5">
            <PunchTimesCell staff={staff} compact />
            <StatusCell
              staff={staff}
              variant="card"
              onPendingClick={
                canApprovePayrollFill ? () => onApprovePayrollFill?.(staff) : undefined
              }
            />
          </div>

          {staff.status === ATTENDANCE_STATUS.VE_SOM ? (
            <div className="mt-1">
              <VeSomNoteField staff={staff} onSave={onSaveVeSomNote} />
            </div>
          ) : staff.note && !staff.missingPunchReason ? (
            <p className="mt-0.5 truncate text-4xs italic text-content-muted" title={staff.note}>
              {UI.noteLabel}: {staff.note}
            </p>
          ) : null}

          <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 shrink-0 items-center gap-2">
              <DeptFingerprintActionsMenu
                compact
                canFillTimes={canFillTimes}
                canApprovePayrollFill={canApprovePayrollFill}
                canClear={canClear}
                onOpenScanLogs={() => onOpenScanLogs?.(staff)}
                onFillTimes={() => onFillTimes?.(staff)}
                onApprovePayrollFill={() => onApprovePayrollFill?.(staff)}
                onClearAttendance={() => onClearAttendance?.(staff)}
              />
              <button
                type="button"
                className="shrink-0 text-4xs font-semibold text-primary"
                onClick={() => onOpenManualSchedule?.(staff)}
              >
                {MANUAL_SCHEDULE_UI.openLink}
              </button>
            </div>
            {kioskLabel ? (
              <p className="min-w-0 max-w-[42%] truncate text-4xs text-content-muted" title={kioskLabel}>
                {kioskLabel}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <MobileQuickActionGrid
        staff={staff}
        dense
        lockFingerprintPresence={false}
        onQuickAction={onQuickAction}
      />
    </article>
  );
});

export default DeptAttendanceStaffCard;
