import { memo, useMemo } from 'react';
import { UI } from '../../../constants/attendance';
import { formatDeptCode } from '../../../utils/formatters';
import { IconSend } from '../../icons/Icons';
import NotificationBell from '../../shared/NotificationBell';
import DatePillBar from '../../dashboard/DatePillBar';
import HeadPageHeader from '../../layout/HeadPageHeader';

const AttendanceHeader = memo(function AttendanceHeader({
  deptName,
  selectedDate,
  recentDates,
  onDateChange,
  isAdmin,
  onUnlock,
  locked,
  unlocked,
  reportSent,
  reportBlocked,
  tableDisabled,
  onSendReport,
  onNotificationDate,
  departments,
  selectedDept,
  onDeptChange,
}) {
  const breadcrumb = useMemo(
    () => [
      { label: UI.breadcrumbSystem },
      { label: UI.breadcrumbAttendance },
      { label: deptName || '...' },
    ],
    [deptName],
  );

  const adminSlot =
    isAdmin && departments?.length > 0 ? (
      <select
        value={selectedDept}
        onChange={(e) => onDeptChange(Number(e.target.value))}
        className="mb-1.5 max-w-full border border-line rounded-lg px-2.5 py-1 bg-surface-white text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
      >
        {departments.map((d) => (
          <option key={d.deptCode} value={d.deptCode}>
            [{d.deptCodeFormatted || formatDeptCode(d.deptCode)}] {d.deptName}
          </option>
        ))}
      </select>
    ) : null;

  return (
    <HeadPageHeader breadcrumb={breadcrumb} adminSlot={adminSlot}>
      <DatePillBar
        variant="attendance"
        selectedDate={selectedDate}
        recentDates={recentDates}
        onDateChange={onDateChange}
      />
      <NotificationBell
        onAttendanceNavigate={onNotificationDate}
        className="shrink-0"
        variant="attendance"
      />

      <button
        type="button"
        onClick={onSendReport}
        disabled={tableDisabled || reportSent || reportBlocked}
        title={reportBlocked ? UI.reportBlocked : undefined}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#204FC2] hover:bg-[#1A42A8] text-white text-xs font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
      >
        <IconSend className="w-3.5 h-3.5" />
        {reportSent ? UI.reportSent : UI.sendReportButton}
      </button>
      {isAdmin && locked && !unlocked && onUnlock && (
        <button
          type="button"
          onClick={onUnlock}
          className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-line bg-surface-white text-navy hover:bg-neutral"
        >
          {UI.unlockButton}
        </button>
      )}
    </HeadPageHeader>
  );
});

export default AttendanceHeader;
