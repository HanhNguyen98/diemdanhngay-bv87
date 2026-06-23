import { memo } from 'react';
import ReminderHistoryTable from '../dashboard/reminder-history/ReminderHistoryTable';
import ReminderDeptStatsChart from '../dashboard/reminder-history/ReminderDeptStatsChart';
import ReminderHistoryMobileSection from '../dashboard/reminder-history/mobile/ReminderHistoryMobileSection';
import InlineErrorBanner from '../../shared/InlineErrorBanner';

const CARD = 'bg-surface-white border border-line rounded-xl shadow-card shrink-0';

const ReminderHistoryContent = memo(function ReminderHistoryContent({
  paginated,
  filteredCount,
  page,
  totalPages,
  pageSize,
  onPageChange,
  stats,
  loading,
  initialLoading,
  refreshing,
  exporting,
  error,
  departments,
  deptFilter,
  onDeptFilterChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApplyFilter,
  onResetFilter,
  onExport,
}) {
  return (
    <div className="flex flex-col h-full min-h-0 gap-2 w-full min-w-0 max-w-full">
      <InlineErrorBanner message={error} className="shrink-0" />

      <section className={`${CARD} p-4`}>
        <ReminderDeptStatsChart
          stats={stats}
          initialLoading={initialLoading}
          refreshing={refreshing}
        />
      </section>

      <ReminderHistoryMobileSection
        departments={departments}
        deptFilter={deptFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
        onApplyFilter={onApplyFilter}
        onResetFilter={onResetFilter}
        items={paginated}
        loading={loading}
        initialLoading={initialLoading}
        refreshing={refreshing}
        filteredCount={filteredCount}
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        exporting={exporting}
        onExport={onExport}
      />

      <ReminderHistoryTable
        className="hidden lg:flex flex-1 min-h-0"
        items={paginated}
        filteredCount={filteredCount}
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={onPageChange}
        loading={loading}
        initialLoading={initialLoading}
        refreshing={refreshing}
        exporting={exporting}
        onExport={onExport}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
        onApplyFilter={onApplyFilter}
        onResetFilter={onResetFilter}
        departments={departments}
        deptFilter={deptFilter}
        onDeptFilterChange={onDeptFilterChange}
      />
    </div>
  );
});

export default ReminderHistoryContent;
