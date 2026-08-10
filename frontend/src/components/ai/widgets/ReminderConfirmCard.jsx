import { useMemo, useState } from 'react';
import { AI_ASSISTANT_UI } from '../../../constants/aiAssistant';

function deptMissingLabel(dept) {
  const total = dept.missingCount;
  if (total != null) {
    const checkout = dept.missingCheckoutCount ?? 0;
    const unmarked = dept.unmarkedCount ?? 0;
    const parts = [];
    if (checkout > 0) parts.push(`${checkout} thiếu giờ ra`);
    if (unmarked > 0) parts.push(`${unmarked} chưa chấm`);
    if (parts.length === 0) return `${total} thiếu`;
    return `${total} · ${parts.join(', ')}`;
  }
  return `${dept.markedCount}/${dept.total} · ${dept.progressPercent}%`;
}

export default function ReminderConfirmCard({ payload, onConfirm, onCancel, loading }) {
  const departments = payload?.departments || [];
  const [selected, setSelected] = useState(() => departments.map((d) => d.deptCode));

  const allSelected = useMemo(
    () => departments.length > 0 && selected.length === departments.length,
    [departments.length, selected.length],
  );

  if (departments.length === 0) {
    return (
      <p className="mt-2 text-sm text-content-muted">{AI_ASSISTANT_UI.widgets.reminderEmpty}</p>
    );
  }

  const toggle = (deptCode) => {
    setSelected((prev) =>
      prev.includes(deptCode) ? prev.filter((c) => c !== deptCode) : [...prev, deptCode],
    );
  };

  const toggleAll = () => {
    setSelected(allSelected ? [] : departments.map((d) => d.deptCode));
  };

  return (
    <div className="mt-2 rounded-xl border border-line bg-surface-white p-3 shadow-sm">
      <p className="text-sm font-semibold text-navy">{AI_ASSISTANT_UI.widgets.reminderTitle}</p>
      <p className="text-xs text-content-muted mt-0.5">
        {AI_ASSISTANT_UI.widgets.reminderHintPrefix}
        {payload?.dateFormatted
          ? ` ngày ${payload.dateFormatted}:`
          : `${AI_ASSISTANT_UI.widgets.reminderHintDefaultYesterday}:`}
      </p>

      <label className="flex items-center gap-2 mt-3 mb-2 text-xs font-medium text-navy cursor-pointer">
        <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
        {AI_ASSISTANT_UI.widgets.reminderSelectAll}
      </label>

      <ul className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
        {departments.map((dept) => (
          <li key={dept.deptCode}>
            <label className="flex items-center gap-2 text-xs cursor-pointer py-1">
              <input
                type="checkbox"
                checked={selected.includes(dept.deptCode)}
                onChange={() => toggle(dept.deptCode)}
                className="rounded shrink-0"
              />
              <span className="flex-1 min-w-0 truncate text-navy">
                [{dept.deptCodeFormatted}] {dept.deptName}
              </span>
              <span className="shrink-0 text-content-muted tabular-nums whitespace-nowrap text-right">
                {deptMissingLabel(dept)}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="h-8 px-3 rounded-lg border border-line text-xs text-content-muted hover:bg-neutral disabled:opacity-60"
        >
          {AI_ASSISTANT_UI.widgets.reminderCancel}
        </button>
        <button
          type="button"
          onClick={() => onConfirm(selected)}
          disabled={loading || selected.length === 0}
          className="h-8 px-3 rounded-lg btn-primary text-xs disabled:opacity-60"
        >
          {loading ? AI_ASSISTANT_UI.widgets.reminderSending : AI_ASSISTANT_UI.widgets.reminderConfirm}
        </button>
      </div>
    </div>
  );
}
