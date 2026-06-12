import { memo, useMemo } from 'react';
import { UI } from '../../../constants/attendance';
import DatePillBar from '../../dashboard/DatePillBar';
import MobileHeadBreadcrumb from '../../layout/MobileHeadBreadcrumb';

const AttendanceMobileSubheader = memo(function AttendanceMobileSubheader({
  deptName,
  selectedDate,
  recentDates,
  onDateChange,
}) {
  const breadcrumbItems = useMemo(
    () => [
      { label: UI.breadcrumbSystem },
      { label: UI.breadcrumbAttendance },
      { label: deptName || '...' },
    ],
    [deptName],
  );

  return (
    <div className="lg:hidden shrink-0 border-b border-line bg-surface-page px-[clamp(0.75rem,3vw,1.25rem)] py-3 space-y-3 min-w-0">
      <MobileHeadBreadcrumb items={breadcrumbItems} />

      <div className="overflow-x-auto -mx-1 px-1">
        <DatePillBar
          variant="attendance"
          compact
          selectedDate={selectedDate}
          recentDates={recentDates}
          onDateChange={onDateChange}
        />
      </div>
    </div>
  );
});

export default AttendanceMobileSubheader;
