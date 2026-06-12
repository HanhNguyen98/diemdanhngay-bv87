import InlineErrorBanner from '../../../shared/InlineErrorBanner';
import DashboardKpiBar from '../DashboardKpiBar';
import DeptAttendanceFilterBar from './DeptAttendanceFilterBar';
import DeptAttendanceTable from './DeptAttendanceTable';
import { useDeptAttendanceDetail } from '../../../../hooks/useDeptAttendanceDetail';

export default function DeptAttendanceDetailPage() {
  const {
    departments,
    draftDeptCode,
    setDraftDeptCode,
    draftDate,
    setDraftDate,
    applyFilter,
    kpi,
    paginated,
    loading,
    error,
    page,
    totalPages,
    pageSize,
    goToPage,
    filteredCount,
    exporting,
    handleExport,
  } = useDeptAttendanceDetail();

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <InlineErrorBanner message={error} className="shrink-0" />

      <div className="shrink-0">
        <DeptAttendanceFilterBar
          departments={departments}
          deptCode={draftDeptCode}
          onDeptChange={setDraftDeptCode}
          date={draftDate}
          onDateChange={setDraftDate}
          onApply={applyFilter}
          onExport={handleExport}
          loading={loading}
          exporting={exporting}
          canExport={filteredCount > 0}
        />
      </div>

      <div className="shrink-0">
        <DashboardKpiBar kpi={kpi} />
      </div>

      <DeptAttendanceTable
        items={paginated}
        loading={loading}
        page={page}
        totalPages={totalPages}
        totalItems={filteredCount}
        pageSize={pageSize}
        onPageChange={goToPage}
      />
    </div>
  );
}
