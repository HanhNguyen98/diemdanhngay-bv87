import { memo } from 'react';
import { ADMIN_UI } from '../../../constants/admin';

const ReminderModal = memo(function ReminderModal({
  open,
  incompleteDepts,
  remindableDepts,
  selectedDeptCodes,
  onToggleDept,
  onToggleAll,
  onClose,
  onSend,
  sending,
}) {
  if (!open) return null;
  const { dashboard: d } = ADMIN_UI;
  const allRemindableSelected =
    remindableDepts.length > 0 && selectedDeptCodes.length === remindableDepts.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-panel w-full max-w-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-line/60">
          <h2 className="text-base font-bold text-content-heading">{d.reminderModalTitle}</h2>
          <p className="text-xs text-content-muted mt-1 leading-relaxed">{d.reminderModalHint}</p>
        </div>
        <div className="p-5 max-h-80 overflow-y-auto">
          {incompleteDepts.length === 0 ? (
            <p className="text-sm text-content-muted">{d.noIncomplete}</p>
          ) : (
            <>
              {remindableDepts.length > 0 ? (
                <label className="flex items-center gap-2 mb-3 text-sm font-medium text-content-body cursor-pointer">
                  <input type="checkbox" checked={allRemindableSelected} onChange={onToggleAll} />
                  {d.reminderSelectAll}
                </label>
              ) : (
                <p className="text-sm text-warning-fg bg-warning rounded-lg px-3 py-2 mb-3">
                  {d.reminderNoHeadHint}
                </p>
              )}
              <ul className="space-y-3">
                {incompleteDepts.map((dept) => {
                  const canSend = dept.hasActiveHeadAccount === true;
                  return (
                    <li key={dept.deptCode}>
                      <label
                        className={`flex items-start gap-2 text-sm py-1 ${canSend ? 'cursor-pointer' : 'cursor-not-allowed opacity-90'
                          }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 shrink-0"
                          checked={canSend && selectedDeptCodes.includes(dept.deptCode)}
                          disabled={!canSend}
                          onChange={() => canSend && onToggleDept(dept.deptCode)}
                        />
                        <span className="flex-1 min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-content-heading">{dept.deptName}</span>
                            {canSend ? (
                              <span className="badge-success text-3xs font-semibold uppercase px-2 py-0.5 rounded">
                                {d.reminderReadyBadge}
                              </span>
                            ) : (
                              <span className="badge-warning text-3xs font-semibold uppercase px-2 py-0.5 rounded">
                                {d.reminderNoHeadBadge}
                              </span>
                            )}
                          </span>
                          {!canSend && (
                            <p className="text-xs text-content-muted mt-1 leading-snug">
                              {d.reminderNoHeadHint}
                            </p>
                          )}
                          <span className="block text-xs text-content-muted tabular-nums mt-0.5">
                            {dept.markedCount}/{dept.total} · {dept.progressPercent}%
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
        <div className="px-5 py-3 border-t border-line/60 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-line text-sm text-content-muted hover:bg-neutral"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={
              sending ||
              remindableDepts.length === 0 ||
              selectedDeptCodes.length === 0
            }
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
