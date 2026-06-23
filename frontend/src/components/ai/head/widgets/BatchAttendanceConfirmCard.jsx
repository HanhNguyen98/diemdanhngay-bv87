import { HEAD_AI_ASSISTANT_UI } from '../../../../constants/headAiAssistant';

export default function BatchAttendanceConfirmCard({ payload = {}, loading, onCancel, onConfirm }) {
  const staff = payload.staff || [];
  const overwriteWarning = HEAD_AI_ASSISTANT_UI.widgets.overwriteWarning(payload.overwriteCount || 0);

  if (staff.length === 0) {
    return (
      <div className="mt-2 rounded-xl border border-warning-border bg-warning p-3 text-sm text-warning-text">
        {HEAD_AI_ASSISTANT_UI.widgets.emptyTargets}
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-line bg-surface-white p-3 text-left shadow-sm">
      <p className="text-sm font-semibold text-content-heading">{HEAD_AI_ASSISTANT_UI.widgets.confirmTitle}</p>
      <p className="text-xs text-content-muted mt-1">
        {payload.scopeLabel} · {payload.statusLabel} · {payload.targetCount} nhân viên
      </p>
      {overwriteWarning && (
        <p className="text-xs text-warning-dark mt-2 font-medium">{overwriteWarning}</p>
      )}
      <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-line">
        <table className="w-full text-xs">
          <thead className="bg-table-header text-content-muted">
            <tr>
              <th className="px-2 py-1.5 text-left">{HEAD_AI_ASSISTANT_UI.widgets.colEmployee}</th>
              <th className="px-2 py-1.5 text-left">{HEAD_AI_ASSISTANT_UI.widgets.colCurrent}</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((row) => (
              <tr key={row.empCode} className="border-t border-line">
                <td className="px-2 py-1.5">
                  <div className="font-medium text-content-heading">{row.fullname}</div>
                  <div className="text-content-muted">{row.empCodeFormatted}</div>
                </td>
                <td className="px-2 py-1.5 text-content-body">{row.currentStatusLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex gap-2 justify-end">
        <button
          type="button"
          disabled={loading}
          onClick={onCancel}
          className="rounded-lg border border-line px-3 py-1.5 text-sm text-content-body hover:bg-neutral disabled:opacity-60"
        >
          {HEAD_AI_ASSISTANT_UI.widgets.confirmCancel}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => onConfirm(payload.actionId)}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {loading ? HEAD_AI_ASSISTANT_UI.widgets.confirmSending : HEAD_AI_ASSISTANT_UI.widgets.confirmSubmit}
        </button>
      </div>
    </div>
  );
}
