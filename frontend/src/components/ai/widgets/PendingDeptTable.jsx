import { AI_ASSISTANT_UI } from '../../../constants/aiAssistant';

function deptMissingLabel(dept) {
  const total = dept.missingCount ?? (dept.markedCount != null ? null : 0);
  if (total != null) {
    const checkout = dept.missingCheckoutCount ?? 0;
    const unmarked = dept.unmarkedCount ?? 0;
    const parts = [];
    if (checkout > 0) parts.push(`${checkout} thiếu giờ ra`);
    if (unmarked > 0) parts.push(`${unmarked} chưa chấm`);
    if (parts.length === 0) return `${total} thiếu`;
    return `${total} · ${parts.join(', ')}`;
  }
  // Legacy shape
  return `${dept.markedCount}/${dept.total} · ${dept.progressPercent}%`;
}

export default function PendingDeptTable({ payload, onSendReminders, loading }) {
  const departments = payload?.departments || [];

  if (departments.length === 0) {
    return (
      <p className="mt-2 text-sm text-content-muted">{AI_ASSISTANT_UI.widgets.pendingEmpty}</p>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-line bg-surface-white overflow-hidden shadow-sm">
      <div className="px-3 py-2 border-b border-line bg-surface-page/60">
        <p className="text-sm font-semibold text-navy">{AI_ASSISTANT_UI.widgets.pendingTitle}</p>
        <p className="text-xs text-content-muted">{payload?.dateFormatted}</p>
      </div>
      <ul className="max-h-40 overflow-y-auto divide-y divide-line">
        {departments.map((dept) => (
          <li key={dept.deptCode} className="px-3 py-2 flex items-center justify-between gap-2 text-xs">
            <span className="text-navy min-w-0 truncate">
              [{dept.deptCodeFormatted}] {dept.deptName}
            </span>
            <span className="shrink-0 tabular-nums text-content-muted whitespace-nowrap text-right">
              {deptMissingLabel(dept)}
            </span>
          </li>
        ))}
      </ul>
      {payload?.showReminderCta && (
        <div className="px-3 py-2 border-t border-line bg-primary-light/50">
          <p className="text-xs text-navy mb-2">{AI_ASSISTANT_UI.widgets.pendingReminderPrompt}</p>
          <button
            type="button"
            disabled={loading}
            onClick={onSendReminders}
            className="h-8 px-3 rounded-lg btn-primary text-xs disabled:opacity-60"
          >
            {AI_ASSISTANT_UI.widgets.pendingReminderCta}
          </button>
        </div>
      )}
    </div>
  );
}
