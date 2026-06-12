import { memo } from 'react';
import { ADMIN_UI } from '../../../constants/admin';

const ReminderModal = memo(function ReminderModal({
  open,
  incompleteDepts,
  selectedDeptCodes,
  onToggleDept,
  onToggleAll,
  onClose,
  onSend,
  sending,
}) {
  if (!open) return null;
  const { dashboard: d } = ADMIN_UI;
  const allSelected =
    incompleteDepts.length > 0 && selectedDeptCodes.length === incompleteDepts.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-panel w-full max-w-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">{d.reminderModalTitle}</h2>
          <p className="text-xs text-content-muted mt-1">{d.reminderModalHint}</p>
        </div>
        <div className="p-5 max-h-80 overflow-y-auto">
          {incompleteDepts.length === 0 ? (
            <p className="text-sm text-content-muted">{d.noIncomplete}</p>
          ) : (
            <>
              <label className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700 cursor-pointer">
                <input type="checkbox" checked={allSelected} onChange={onToggleAll} />
                {d.reminderSelectAll}
              </label>
              <ul className="space-y-2">
                {incompleteDepts.map((dept) => (
                  <li key={dept.deptCode}>
                    <label className="flex items-center gap-2 text-sm cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={selectedDeptCodes.includes(dept.deptCode)}
                        onChange={() => onToggleDept(dept.deptCode)}
                      />
                      <span className="flex-1">{dept.deptName}</span>
                      <span className="text-xs text-content-muted tabular-nums">
                        {dept.markedCount}/{dept.total} · {dept.progressPercent}%
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-gray-200 text-sm text-content-muted hover:bg-neutral"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={sending || incompleteDepts.length === 0 || selectedDeptCodes.length === 0}
            className="h-9 px-4 rounded-lg btn-primary text-sm disabled:opacity-60"
          >
            {sending ? 'Đang gửi...' : d.reminderSend}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ReminderModal;
