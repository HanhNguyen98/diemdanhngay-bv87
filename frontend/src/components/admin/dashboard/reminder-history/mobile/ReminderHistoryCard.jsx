import { memo } from 'react';
import { Clock } from 'lucide-react';
import { ADMIN_UI } from '../../../../../constants/admin';
import { formatDateDMY, formatDeptCode } from '../../../../../utils/formatters';
import { formatLogTimeHM } from '../../../../../utils/reminderHistory';
import ReminderTypeBadge from '../ReminderTypeBadge';

const { dashboard: d } = ADMIN_UI;
const { reminderHistoryMobile: m } = d;

function formatDeptDisplay(row) {
  if (!row.deptName && row.deptCode == null) return '—';
  if (row.deptCode != null) {
    return `${row.deptName}`;
  }
  return row.deptName;
}

const ReminderHistoryCard = memo(function ReminderHistoryCard({ row }) {
  return (
    <article className="rounded-xl border border-line bg-surface-white shadow-card overflow-hidden">
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-4xs font-semibold text-content-muted uppercase tracking-wide">
            {d.reminderHistoryColDate}
          </span>
          <ReminderTypeBadge triggerType={row.triggerType} variant="pill" />
        </div>

        <p className="mt-1 text-sm font-bold text-content-heading tabular-nums">
          {formatDateDMY(row.attendanceDate)}
        </p>

        <p className="mt-3 text-4xs font-semibold text-content-muted uppercase tracking-wide">
          {d.reminderHistoryColDept}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-primary leading-snug line-clamp-2">
          {formatDeptDisplay(row)}
        </p>
      </div>

      <div className="px-3.5 py-2.5 border-t border-line bg-attendance-search/50">
        <span className="inline-flex items-center gap-1.5 text-xs text-content-muted tabular-nums">
          <Clock className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
          {m.sentAtLabel} {formatLogTimeHM(row.createdAt)}
        </span>
      </div>
    </article>
  );
});

export default ReminderHistoryCard;
