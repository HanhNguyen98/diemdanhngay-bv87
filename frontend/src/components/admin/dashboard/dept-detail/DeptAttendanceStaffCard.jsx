import { memo } from 'react';
import { UI } from '../../../../constants/attendance';
import StaffAvatar from '../../../attendance/table/StaffAvatar';
import StatusBadge from '../../../attendance/table/StatusBadge';

const DeptAttendanceStaffCard = memo(function DeptAttendanceStaffCard({ staff }) {
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
        </div>

        <div className="shrink-0 min-w-0 max-w-[52%] flex justify-end">
          <StatusBadge staff={staff} variant="card" />
        </div>
      </div>
    </article>
  );
});

export default DeptAttendanceStaffCard;
