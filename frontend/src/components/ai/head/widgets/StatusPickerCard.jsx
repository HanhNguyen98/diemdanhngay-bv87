import { HEAD_AI_ASSISTANT_UI } from '../../../../constants/headAiAssistant';
import { useAttendanceStatusConfig } from '../../../../context/AttendanceStatusContext';
import { ATTENDANCE_STATUS } from '../../../../constants/attendance';

/** P6-QuickParentUx — AI picker = manual leaves except VE_SOM / presence / group parents */
export default function StatusPickerCard({ payload = {}, loading, onSubmit }) {
  const { items, statusBadge } = useAttendanceStatusConfig();
  const scope = payload.scope || 'unchecked_only';
  const options = (items || [])
    .filter(
      (item) =>
        item.manualAllowed &&
        !item.groupParent &&
        item.code !== ATTENDANCE_STATUS.DI_LAM &&
        item.code !== ATTENDANCE_STATUS.DI_TRE &&
        item.code !== ATTENDANCE_STATUS.VE_SOM,
    )
    .map((item) => ({
      value: item.code,
      label: statusBadge[item.code]?.label || item.label || item.code,
    }));

  return (
    <div className="mt-2 rounded-xl border border-line bg-surface-white p-3 text-left shadow-sm">
      <p className="text-sm font-semibold text-content-heading">
        {HEAD_AI_ASSISTANT_UI.widgets.statusPickerTitle}
      </p>
      <p className="text-xs text-content-muted mt-1">{HEAD_AI_ASSISTANT_UI.widgets.statusPickerHint}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {options.map((option) => (
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
