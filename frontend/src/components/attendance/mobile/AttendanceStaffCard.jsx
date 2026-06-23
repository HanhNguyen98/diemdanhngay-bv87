import { memo } from 'react';
import { MOBILE_UI, UI, isAttendanceUnchecked } from '../../../constants/attendance';
import StaffAvatar from '../table/StaffAvatar';
import StatusBadge from '../table/StatusBadge';
import MobileQuickActionGrid from './MobileQuickActionGrid';

const AttendanceStaffCard = memo(function AttendanceStaffCard({ staff, disabled, onQuickAction }) {
  const unchecked = isAttendanceUnchecked(staff);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <StaffAvatar staff={staff} />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-navy truncate">{staff.fullname}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {staff.rankName && (
              <span className="inline-flex px-2 py-0.5 rounded-md bg-primary-light text-primary text-[0.70rem] font-semibold">
                {staff.rankName}
              </span>
            )}
            {staff.positionName && (
              <span className="text-4xs text-content-muted truncate">{staff.positionName}</span>
            )}
          </div>
        </div>

        
      </div>

      <MobileQuickActionGrid staff={staff} disabled={disabled} onQuickAction={onQuickAction} />
    </article>
  );
});

export default AttendanceStaffCard;
