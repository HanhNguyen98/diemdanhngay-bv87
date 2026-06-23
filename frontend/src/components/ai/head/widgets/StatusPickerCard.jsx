import { HEAD_AI_ASSISTANT_UI } from '../../../../constants/headAiAssistant';
import { useAttendanceStatusConfig } from '../../../../context/AttendanceStatusContext';

export default function StatusPickerCard({ payload = {}, loading, onSubmit }) {
  const { statusOptions } = useAttendanceStatusConfig();
  const scope = payload.scope || 'unchecked_only';

  return (
    <div className="mt-2 rounded-xl border border-line bg-surface-white p-3 text-left shadow-sm">
      <p className="text-sm font-semibold text-content-heading">
        {HEAD_AI_ASSISTANT_UI.widgets.statusPickerTitle}
      </p>
      <p className="text-xs text-content-muted mt-1">{HEAD_AI_ASSISTANT_UI.widgets.statusPickerHint}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={loading}
            onClick={() => onSubmit({ status: option.value, scope })}
            className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-content-body hover:bg-neutral disabled:opacity-60"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
