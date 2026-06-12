import { memo } from 'react';
import ReminderHistoryFilterBar from '../dashboard/reminder-history/ReminderHistoryFilterBar';
import ReminderHistoryTable from '../dashboard/reminder-history/ReminderHistoryTable';
import ReminderDeptStatsChart from '../dashboard/reminder-history/ReminderDeptStatsChart';
import InlineErrorBanner from '../../shared/InlineErrorBanner';

const CARD = 'bg-surface-white border border-gray-200 rounded-xl shadow-card shrink-0';

const ReminderHistoryContent = memo(function ReminderHistoryContent({
  paginated,
  filteredCount,
  page,
  totalPages,
  pageSize,
  onPageChange,
  stats,
  loading,
  exporting,
  error,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApplyFilter,
  onExport,
}) {
  return (
    <div className="flex flex-col h-full min-h-0 gap-2 w-full">
      <section className={`${CARD} px-4 py-3`}>
        <ReminderHistoryFilterBar
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={onDateFromChange}
          onDateToChange={onDateToChange}
          onApply={onApplyFilter}
          loading={loading}
        />
      </section>

      <InlineErrorBanner message={error} className="shrink-0" />

      <section className={`${CARD} p-4`}>
        <ReminderDeptStatsChart stats={stats} loading={loading} />
      </section>

      <ReminderHistoryTable
        className="flex-1 min-h-0"
        items={paginated}
        filteredCount={filteredCount}
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={onPageChange}
        loading={loading}
        exporting={exporting}
        onExport={onExport}
      />
    </div>
  );
});

export default ReminderHistoryContent;
