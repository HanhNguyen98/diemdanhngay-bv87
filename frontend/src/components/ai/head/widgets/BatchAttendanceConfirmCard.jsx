import { HEAD_AI_ASSISTANT_UI } from '../../../../constants/headAiAssistant';

export default function BatchAttendanceConfirmCard({ payload = {}, loading, onCancel, onConfirm }) {
  const staff = payload.staff || [];
  const overwriteWarning = HEAD_AI_ASSISTANT_UI.widgets.overwriteWarning(payload.overwriteCount || 0);

  if (staff.length === 0) {
    return (
      <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        {HEAD_AI_ASSISTANT_UI.widgets.emptyTargets}
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm">
      <p className="text-sm font-semibold text-gray-800">{HEAD_AI_ASSISTANT_UI.widgets.confirmTitle}</p>
      <p className="text-xs text-gray-600 mt-1">
        {payload.scopeLabel} · {payload.statusLabel} · {payload.targetCount} nhân viên
      </p>
      {overwriteWarning && (
        <p className="text-xs text-amber-700 mt-2 font-medium">{overwriteWarning}</p>
      )}
      <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-gray-100">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-2 py-1.5 text-left">{HEAD_AI_ASSISTANT_UI.widgets.colEmployee}</th>
              <th className="px-2 py-1.5 text-left">{HEAD_AI_ASSISTANT_UI.widgets.colCurrent}</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((row) => (
              <tr key={row.empCode} className="border-t border-gray-100">
                <td className="px-2 py-1.5">
                  <div className="font-medium text-gray-800">{row.fullname}</div>
                  <div className="text-gray-500">{row.empCodeFormatted}</div>
                </td>
                <td className="px-2 py-1.5 text-gray-600">{row.currentStatusLabel}</td>
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
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {HEAD_AI_ASSISTANT_UI.widgets.confirmCancel}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => onConfirm(payload.actionId)}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? HEAD_AI_ASSISTANT_UI.widgets.confirmSending : HEAD_AI_ASSISTANT_UI.widgets.confirmSubmit}
        </button>
      </div>
    </div>
  );
}
