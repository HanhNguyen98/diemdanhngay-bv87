import { memo } from 'react';
import { UI } from '../../../../constants/attendance';
import StaffAvatar from '../../../attendance/table/StaffAvatar';
import StatusBadge from '../../../attendance/table/StatusBadge';

const DeptAttendanceRow = memo(function DeptAttendanceRow({ staff }) {
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
        <StatusBadge staff={staff} />
      </td>
     
    </tr>
  );
});

export default DeptAttendanceRow;
