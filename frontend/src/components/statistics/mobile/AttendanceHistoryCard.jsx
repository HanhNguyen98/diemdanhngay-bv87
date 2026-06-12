import { memo } from 'react';
import { STATISTICS_UI, UI } from '../../../constants/attendance';
import StaffAvatar from '../../attendance/table/StaffAvatar';
import StatusBadge from '../../attendance/table/StatusBadge';
import { IconCalendar } from '../../icons/Icons';

const AttendanceHistoryCard = memo(function AttendanceHistoryCard({ item, deptName }) {
  const staff = {
    recordId: item.recordId,
    status: item.status,
    statusLabel: item.statusLabel,
    fullname: item.fullname,
    empCodeFormatted: item.empCodeFormatted,
    avatarUrl: item.avatarUrl,
  };

  const noteText = item.note?.trim();
  const msnvLine = deptName
    ? `${STATISTICS_UI.mobileMsnvPrefix} ${item.empCodeFormatted} • ${deptName}`
    : `${STATISTICS_UI.mobileMsnvPrefix} ${item.empCodeFormatted}`;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <StaffAvatar staff={staff} />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-navy truncate pr-2">{item.fullname}</p>
          <p className="text-4xs text-content-muted truncate mt-0.5">{msnvLine}</p>
        </div>

        <div className="shrink-0">
          <StatusBadge staff={staff} />
        </div>
      </div>

      <div className="my-2.5 border-t border-dashed border-slate-200" />

      <div className="flex items-center justify-between gap-3 text-4xs">
        <div className="flex items-center gap-1.5 text-content-muted shrink-0">
          <IconCalendar className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="tabular-nums">{item.attendanceDateFormatted}</span>
        </div>
        <p className="text-content-muted italic text-right truncate min-w-0">
          {noteText ? (
            <>
              <span className="not-italic font-medium">{STATISTICS_UI.mobileNotePrefix}</span>{' '}
              {noteText}
            </>
          ) : (
            UI.emptyCell
          )}
        </p>
      </div>
    </article>
  );
});

export default AttendanceHistoryCard;
