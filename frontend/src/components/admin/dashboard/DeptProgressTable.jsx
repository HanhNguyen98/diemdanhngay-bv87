import { memo } from 'react';
import { ADMIN_UI } from '../../../constants/admin';
import DashboardToolbar from './DashboardToolbar';
import DeptRowActions from './DeptRowActions';

const DeptProgressTable = memo(function DeptProgressTable({
  departments,
  onUnlock,
  onBlockReport,
  onUnblockReport,
  actionLoading,
}) {
  const { dashboard: d } = ADMIN_UI;

  return (
    <section className="bg-surface-white border border-gray-200 rounded-xl shadow-card overflow-hidden flex flex-col min-h-0">
      <div className="px-4 py-2 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-800">{d.progressTitle}</h3>
        </div>
        <DashboardToolbar />
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header-row">
              <th className="table-th-left">{d.colDept}</th>
              <th className="table-th-center">{d.colProgress}</th>
              <th className="table-th-center">{d.colRate}</th>
              <th className="table-th-center">{d.colStatus}</th>
              <th className="table-th-center w-12" />
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => {
              const completed = dept.completionStatus === 'COMPLETED';
              return (
                <tr key={dept.deptCode} className="border-b border-gray-100 hover:bg-surface-page/50">
                  <td className="py-3 px-4 font-medium text-gray-800">{dept.deptName}</td>
                  <td className="py-3 px-4 text-center tabular-nums text-content-muted">
                    {dept.markedCount}/{dept.total}
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums font-semibold text-gray-800">
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
                  <td className="py-3 px-4 text-center">
                    <DeptRowActions
                      dept={dept}
                      onUnlock={onUnlock}
                      onBlockReport={onBlockReport}
                      onUnblockReport={onUnblockReport}
                      disabled={actionLoading}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
});

export default DeptProgressTable;
