import { memo } from 'react';
import { UI } from '../../../constants/attendance';
import StaffAvatar from '../../attendance/table/StaffAvatar';
import StatusBadge from '../../attendance/table/StatusBadge';

const AttendanceHistoryRow = memo(function AttendanceHistoryRow({ item }) {
  const staff = {
    recordId: item.recordId,
    status: item.status,
    statusLabel: item.statusLabel,
    fullname: item.fullname,
    empCodeFormatted: item.empCodeFormatted,
    avatarUrl: item.avatarUrl,
  };

  const noteText = item.note?.trim() ? item.note : UI.emptyCell;

  return (
    <tr className="transition-colors hover:bg-slate-50/60">
      <td className="py-3 px-4 align-middle text-sm text-slate-600 tabular-nums whitespace-nowrap">
        {item.attendanceDateFormatted}
      </td>
      <td className="py-3 px-4 align-middle">
        <div className="flex items-center gap-3 min-w-0">
          <StaffAvatar staff={staff} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{item.fullname}</p>
            <p className="text-xs text-slate-400 truncate mt-0.5">ID: {item.empCodeFormatted}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 align-middle">
        <StatusBadge staff={staff} />
      </td>
      <td className="py-3 px-4 align-middle text-sm text-slate-500 italic">
        {noteText}
      </td>
    </tr>
  );
});

export default AttendanceHistoryRow;
