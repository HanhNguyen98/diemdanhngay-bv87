import { memo, useMemo } from 'react';
import { UI } from '../../../constants/attendance';
import { buildHeadBreadcrumb } from '../../../constants/headLayout';
import { formatDeptCode } from '../../../utils/formatters';
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
  onNotificationDate,
  departments,
  selectedDept,
  onDeptChange,
}) {
  const breadcrumb = useMemo(
    () => buildHeadBreadcrumb(UI.breadcrumbAttendance, deptName),
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
        compact
        variant="attendance"
        selectedDate={selectedDate}
        recentDates={recentDates}
        onDateChange={onDateChange}
      />
      <NotificationBell
        onAttendanceNavigate={onNotificationDate}
        className="shrink-0"
        variant="default"
      />

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
