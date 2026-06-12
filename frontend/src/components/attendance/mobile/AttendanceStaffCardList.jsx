import { memo } from 'react';
import { UI } from '../../../constants/attendance';
import AttendanceStaffCard from './AttendanceStaffCard';

const AttendanceStaffCardList = memo(function AttendanceStaffCardList({
  staffList,
  disabled,
  onQuickAction,
}) {
  if (!staffList?.length) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-slate-500">
        {UI.noStaff}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {staffList.map((staff) => (
        <AttendanceStaffCard
          key={staff.empCode}
          staff={staff}
          disabled={disabled}
          onQuickAction={onQuickAction}
        />
      ))}
    </div>
  );
});

export default AttendanceStaffCardList;
