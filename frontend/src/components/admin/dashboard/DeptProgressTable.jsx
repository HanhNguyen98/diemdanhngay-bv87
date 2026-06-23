import { memo } from 'react';
import { ADMIN_UI } from '../../../constants/admin';
import DashboardToolbar from './DashboardToolbar';
import DeptRowActions from './DeptRowActions';
import TablePagination from '../sections/TablePagination';

const DeptProgressTable = memo(function DeptProgressTable({
  departments,
  onToggleLock,
  onToggleReportBlock,
  isActionPending,
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) {
  const { dashboard: d } = ADMIN_UI;

  return (
    <section className="bg-surface-white border border-line rounded-xl shadow-card overflow-hidden flex flex-col min-h-0 h-full">
      <div className="shrink-0 px-4 py-2 border-b border-line flex flex-wrap items-center justify-between gap-x-3 gap-y-2 min-w-0">
        <h3 className="admin-section-title shrink-0">{d.progressTitle}</h3>
        <div className="min-w-0 flex-1 flex justify-end">
          <DashboardToolbar />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header-row">
              <th className="table-th-left">{d.colDept}</th>
              <th className="table-th-center">{d.colProgress}</th>
              <th className="table-th-center">{d.colRate}</th>
              <th className="table-th-center">{d.colStatus}</th>
              <th className="table-th-center min-w-[4.5rem] px-2">{d.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => {
              const completed = dept.completionStatus === 'COMPLETED';
              return (
                <tr key={dept.deptCode} className="border-b border-line/60 hover:bg-surface-page/50">
                  <td className="py-3 px-4 admin-cell-name">{dept.deptName}</td>
                  <td className="py-3 px-4 text-center tabular-nums text-content-muted">
                    {dept.markedCount}/{dept.total}
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums font-semibold text-content-heading">
                    {dept.progressPercent}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-2xs font-bold uppercase ${
                        completed
                          ? 'bg-success text-success-dark'
                          : 'bg-danger text-danger-fg'
                      }`}
                    >
                      {completed ? d.completed : d.incomplete}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <DeptRowActions
                      dept={dept}
                      onToggleLock={onToggleLock}
                      onToggleReportBlock={onToggleReportBlock}
                      lockLoading={isActionPending(dept.deptCode, 'lock')}
                      reportLoading={isActionPending(dept.deptCode, 'report')}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="shrink-0">
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
          unitLabel="đơn vị"
        />
      </div>
    </section>
  );
});

export default DeptProgressTable;
