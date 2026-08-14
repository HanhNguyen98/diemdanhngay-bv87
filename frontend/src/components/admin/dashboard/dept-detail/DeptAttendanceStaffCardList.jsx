import { memo } from 'react';
import { ADMIN_UI } from '../../../../constants/admin';
import RefreshOverlay from '../../../shared/RefreshOverlay';
import DeptAttendanceStaffCard from './DeptAttendanceStaffCard';

const DeptAttendanceStaffCardList = memo(function DeptAttendanceStaffCardList({
  items,
  initialLoading,
  refreshing = false,
  onOpenScanLogs,
  onOpenManualSchedule,
  onFillTimes,
  onQuickAction,
  onClearAttendance,
  onSaveVeSomNote,
}) {
  const { dashboard: d } = ADMIN_UI;

  if (initialLoading) {
    return (
      <div className="py-16 text-center text-content-muted text-sm animate-pulse">
        {d.deptDetailLoading}
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="py-16 text-center text-content-muted text-sm">{d.deptDetailEmpty}</div>
    );
  }

  return (
    <div className="relative">
      {refreshing && <RefreshOverlay />}
      <div className="flex flex-col gap-2 px-2.5 py-2" role="list">
        {items.map((staff) => (
          <DeptAttendanceStaffCard
            key={staff.empCode}
            staff={staff}
            onOpenScanLogs={onOpenScanLogs}
            onOpenManualSchedule={onOpenManualSchedule}
            onFillTimes={onFillTimes}
            onQuickAction={onQuickAction}
            onClearAttendance={onClearAttendance}
            onSaveVeSomNote={onSaveVeSomNote}
          />
        ))}
      </div>
    </div>
  );
});

export default DeptAttendanceStaffCardList;
