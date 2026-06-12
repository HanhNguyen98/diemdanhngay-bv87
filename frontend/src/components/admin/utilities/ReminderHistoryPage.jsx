import { useReminderHistory } from '../../../hooks/useReminderHistory';
import ReminderHistoryContent from './ReminderHistoryContent';

export default function ReminderHistoryPage() {
  const {
    paginated,
    filteredCount,
    page,
    totalPages,
    pageSize,
    goToPage,
    stats,
    loading,
    exporting,
    error,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    applyFilter,
    handleExportExcel,
  } = useReminderHistory({ enabled: true });

  return (
    <ReminderHistoryContent
      paginated={paginated}
      filteredCount={filteredCount}
      page={page}
      totalPages={totalPages}
      pageSize={pageSize}
      onPageChange={goToPage}
      stats={stats}
      loading={loading}
      exporting={exporting}
      error={error}
      dateFrom={dateFrom}
      dateTo={dateTo}
      onDateFromChange={setDateFrom}
      onDateToChange={setDateTo}
      onApplyFilter={applyFilter}
      onExport={handleExportExcel}
    />
  );
}
