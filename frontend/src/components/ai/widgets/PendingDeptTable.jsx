import { AI_ASSISTANT_UI } from '../../../constants/aiAssistant';

export default function PendingDeptTable({ payload, onSendReminders, loading }) {
  const departments = payload?.departments || [];

  if (departments.length === 0) {
    return (
      <p className="mt-2 text-sm text-content-muted">{AI_ASSISTANT_UI.widgets.pendingEmpty}</p>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="px-3 py-2 border-b border-gray-100 bg-surface-page/60">
        <p className="text-sm font-semibold text-gray-800">{AI_ASSISTANT_UI.widgets.pendingTitle}</p>
        <p className="text-xs text-content-muted">{payload?.dateFormatted}</p>
      </div>
      <ul className="max-h-40 overflow-y-auto divide-y divide-gray-50">
        {departments.map((dept) => (
          <li key={dept.deptCode} className="px-3 py-2 flex items-center justify-between gap-2 text-xs">
            <span className="text-gray-800 min-w-0 truncate">
              [{dept.deptCodeFormatted}] {dept.deptName}
            </span>
            <span className="shrink-0 tabular-nums text-content-muted whitespace-nowrap">
              {dept.markedCount}/{dept.total} · {dept.progressPercent}%
            </span>
          </li>
        ))}
      </ul>
      {payload?.showReminderCta && (
        <div className="px-3 py-2 border-t border-gray-100 bg-blue-50/50">
          <p className="text-xs text-gray-700 mb-2">
            Bạn có muốn gửi nhắc nhở đồng loạt đến các ĐƠN VỊ này không?
          </p>
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
