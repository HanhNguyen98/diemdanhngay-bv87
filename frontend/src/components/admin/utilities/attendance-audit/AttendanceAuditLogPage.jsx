import AdminSubmenuBreadcrumb from '../../sections/AdminSubmenuBreadcrumb';
import InlineErrorBanner from '../../../shared/InlineErrorBanner';
import { useAttendanceAuditLogs } from '../../../../hooks/useAttendanceAuditLogs';
import AttendanceAuditTable from './AttendanceAuditTable';
import AttendanceAuditMobileSection from './AttendanceAuditMobileSection';

export default function AttendanceAuditLogPage() {
  const {
    items,
    filteredCount,
    page,
    totalPages,
    pageSize,
    goToPage,
    loading,
    initialLoading,
    refreshing,
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
  } = useAttendanceAuditLogs({ enabled: true });

  return (
    <>
      <AdminSubmenuBreadcrumb parentLabelKey="utilities" currentLabelKey="attendanceAuditLog" />
      <div className="flex flex-col h-full min-h-0 gap-2 w-full min-w-0 max-w-full">
        <InlineErrorBanner message={error} className="shrink-0" />

        <AttendanceAuditMobileSection
          departments={departments}
          deptFilter={deptFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onApplyFilter={(dept) => applyFilter(dept)}
          onResetFilter={resetFilters}
          items={items}
          initialLoading={initialLoading}
          refreshing={refreshing}
          filteredCount={filteredCount}
          page={page}
          totalPages={totalPages}
          onPageChange={goToPage}
        />

        <AttendanceAuditTable
          className="hidden lg:flex flex-1 min-h-0"
          items={items}
          filteredCount={filteredCount}
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={goToPage}
          loading={loading}
          initialLoading={initialLoading}
          refreshing={refreshing}
          departments={departments}
          deptFilter={deptFilter}
          onDeptFilterChange={setDeptFilterImmediate}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onApplyFilter={applyFilter}
          onResetFilter={resetFilters}
        />
      </div>
    </>
  );
}
