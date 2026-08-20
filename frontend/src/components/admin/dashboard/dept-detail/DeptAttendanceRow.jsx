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
import QuickActionGroup from '../../../attendance/table/QuickActionGroup';
import StaffAvatar from '../../../attendance/table/StaffAvatar';
import StatusCell from '../../../attendance/table/StatusCell';
import VeSomNoteField from '../../../attendance/table/VeSomNoteField';
import DeptFingerprintActionsMenu from './DeptFingerprintActionsMenu';

const DeptAttendanceRow = memo(function DeptAttendanceRow({
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
      <td className="py-3 px-4 align-middle">
        <PunchTimesCell staff={staff} />
      </td>
      <td className="py-3 px-4 align-middle text-3xs text-content-muted max-w-[9rem]">
        <span className="block truncate" title={formatKioskMachine(staff)}>{formatKioskMachine(staff)}</span>
      </td>
      <td className="py-3 px-4 align-middle min-w-0 max-w-[8.5rem]">
        <StatusCell
          staff={staff}
          onPendingClick={
            canApprovePayrollFill ? () => onApprovePayrollFill?.(staff) : undefined
          }
        />
      </td>
      <td className="py-3 px-4 align-middle text-sm text-content-muted max-w-[12rem]">
        {staff.status === ATTENDANCE_STATUS.VE_SOM ? (
          <VeSomNoteField staff={staff} onSave={onSaveVeSomNote} />
        ) : staff.note && !staff.missingPunchReason ? (
          <span className="block truncate" title={staff.note}>{staff.note}</span>
        ) : (
          <span className="text-line">—</span>
        )}
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
              canApprovePayrollFill={canApprovePayrollFill}
              canClear={canClear}
              onOpenScanLogs={() => onOpenScanLogs?.(staff)}
              onFillTimes={() => onFillTimes?.(staff)}
              onApprovePayrollFill={() => onApprovePayrollFill?.(staff)}
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
