import { useReminderHistory } from '../../../hooks/useReminderHistory';
import AdminSubmenuBreadcrumb from '../sections/AdminSubmenuBreadcrumb';
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
    initialLoading,
    refreshing,
    exporting,
    error,
    departments,
    deptFilter,
    setDeptFilterImmediate,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    applyFilter,
    resetFilters,
    handleExportExcel,
  } = useReminderHistory({ enabled: true });

  return (
    <>
      <AdminSubmenuBreadcrumb parentLabelKey="utilities" currentLabelKey="reminderHistory" />
      <ReminderHistoryContent
        paginated={paginated}
        filteredCount={filteredCount}
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={goToPage}
        stats={stats}
        loading={loading}
        initialLoading={initialLoading}
        refreshing={refreshing}
        exporting={exporting}
        error={error}
        departments={departments}
        deptFilter={deptFilter}
        onDeptFilterChange={setDeptFilterImmediate}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onApplyFilter={applyFilter}
        onResetFilter={resetFilters}
        onExport={handleExportExcel}
      />
    </>
  );
}
