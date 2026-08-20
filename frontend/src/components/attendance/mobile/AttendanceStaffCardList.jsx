import { memo } from 'react';
import { UI } from '../../../constants/attendance';
import AttendanceStaffCard from './AttendanceStaffCard';

const AttendanceStaffCardList = memo(function AttendanceStaffCardList({
  staffList,
  disabled,
  todayWriteDisabled = false,
  onQuickAction,
  onSaveVeSomNote,
  onOpenScanLogs,
  onOpenManualSchedule,
}) {
  if (!staffList?.length) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-slate-500">
        {UI.noStaff}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 p-2">
      {staffList.map((staff) => (
        <AttendanceStaffCard
          key={staff.empCode}
          staff={staff}
          disabled={disabled}
          todayWriteDisabled={todayWriteDisabled}
          onQuickAction={onQuickAction}
          onSaveVeSomNote={onSaveVeSomNote}
          onOpenScanLogs={onOpenScanLogs}
          onOpenManualSchedule={onOpenManualSchedule}
        />
      ))}
    </div>
  );
});

export default AttendanceStaffCardList;
