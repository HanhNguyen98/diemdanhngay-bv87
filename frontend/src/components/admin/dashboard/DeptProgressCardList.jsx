import { memo } from 'react';
import { ADMIN_UI } from '../../../constants/admin';
import DeptRowActions from './DeptRowActions';

const DeptProgressCard = memo(function DeptProgressCard({
  dept,
  onToggleLock,
  onToggleReportBlock,
  isActionPending,
}) {
  const { dashboard: d } = ADMIN_UI;
  const completed = dept.completionStatus === 'COMPLETED';

  return (
    <article className="rounded-lg border border-line bg-surface-page/40 px-2.5 py-2">
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-content-heading leading-snug">{dept.deptName}</h4>
          <p className="mt-0.5 text-3xs text-content-muted tabular-nums leading-relaxed">
            {d.colProgress}: {dept.markedCount}/{dept.total}
            <span className="mx-1 text-line">|</span>
            {d.colRate}: <span className="font-semibold text-content-heading">{dept.progressPercent}%</span>
          </p>
        </div>
        <DeptRowActions
          dept={dept}
          onToggleLock={onToggleLock}
          onToggleReportBlock={onToggleReportBlock}
          lockLoading={isActionPending(dept.deptCode, 'lock')}
          reportLoading={isActionPending(dept.deptCode, 'report')}
          compact
        />
      </div>
      <div className="mt-1.5">
        <span
          className={`inline-block px-1.5 py-px rounded text-4xs font-semibold uppercase ${
            completed ? 'bg-success text-success-dark' : 'bg-danger text-danger-fg'
          }`}
        >
          {completed ? d.completed : d.incomplete}
        </span>
      </div>
    </article>
  );
});

const DeptProgressCardList = memo(function DeptProgressCardList({
  departments,
  onToggleLock,
  onToggleReportBlock,
  isActionPending,
}) {
  if (!departments?.length) {
    return (
      <div className="flex items-center justify-center py-10 text-3xs text-content-muted">
        Không có ĐƠN VỊ phù hợp.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2.5">
      {departments.map((dept) => (
        <DeptProgressCard
          key={dept.deptCode}
          dept={dept}
          onToggleLock={onToggleLock}
          onToggleReportBlock={onToggleReportBlock}
          isActionPending={isActionPending}
        />
      ))}
    </div>
  );
});

export default DeptProgressCardList;
