import { memo } from 'react';
import { ADMIN_UI, MOBILE_TABLE_PAGINATION_BAR_CLASS } from '../../../../constants/admin';
import MobilePagination from '../../../shared/MobilePagination';
import DeptAttendanceStaffCardList from './DeptAttendanceStaffCardList';

const DeptAttendanceMobileSection = memo(function DeptAttendanceMobileSection({
  items,
  initialLoading,
  refreshing = false,
  page,
  totalPages,
  totalItems,
  onPageChange,
  onOpenScanLogs,
  onOpenManualSchedule,
  onFillTimes,
  onQuickAction,
  onClearAttendance,
}) {
  const { dashboard: d } = ADMIN_UI;

  return (
    <section className="lg:hidden bg-surface-white border border-line rounded-xl shadow-card overflow-hidden">
      <div className="px-2.5 py-2 border-b border-line flex items-baseline justify-between gap-2">
        <h3 className="admin-section-title">{d.deptDetailMobileTitle}</h3>
        <span className="text-4xs text-content-muted tabular-nums whitespace-nowrap shrink-0">
          TỔNG:{' '}
          <span className="font-semibold text-primary">
            {d.deptDetailMobileResultsCount(totalItems)}
          </span>
        </span>
      </div>

      <DeptAttendanceStaffCardList
        items={items}
        initialLoading={initialLoading}
        refreshing={refreshing}
        onOpenScanLogs={onOpenScanLogs}
        onOpenManualSchedule={onOpenManualSchedule}
        onFillTimes={onFillTimes}
        onQuickAction={onQuickAction}
        onClearAttendance={onClearAttendance}
      />

      {!initialLoading && (
        <MobilePagination
          sticky={false}
          className={MOBILE_TABLE_PAGINATION_BAR_CLASS}
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={onPageChange}
        />
      )}
    </section>
  );
});

export default DeptAttendanceMobileSection;
