import { STATUS_OPTIONS } from '../../../../constants/attendance';
import { HEAD_AI_ASSISTANT_UI } from '../../../../constants/headAiAssistant';

export default function StatusPickerCard({ payload = {}, loading, onSubmit }) {
  const scope = payload.scope || 'unchecked_only';

  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm">
      <p className="text-sm font-semibold text-gray-800">{HEAD_AI_ASSISTANT_UI.widgets.statusPickerTitle}</p>
      <p className="text-xs text-gray-500 mt-1">{HEAD_AI_ASSISTANT_UI.widgets.statusPickerHint}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={loading}
            onClick={() => onSubmit({ status: option.value, scope })}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
