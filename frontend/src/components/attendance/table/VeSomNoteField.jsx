import { memo, useEffect, useState } from 'react';
import { ATTENDANCE_STATUS, UI } from '../../../constants/attendance';

/**
 * Single-day VE_SOM reason — SPEC §4.13.5 (not a date-range quick-action).
 */
const VeSomNoteField = memo(function VeSomNoteField({ staff, disabled, onSave }) {
  const [draft, setDraft] = useState(staff?.note || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(staff?.note || '');
  }, [staff?.note, staff?.empCode]);

  if (staff?.status !== ATTENDANCE_STATUS.VE_SOM) {
    return null;
  }

  const handleSave = async () => {
    const note = draft.trim();
    if (!note) return;
    setSaving(true);
    try {
      await onSave?.(staff.empCode, note);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-w-0 w-full max-w-[16rem] items-stretch gap-1.5">
      <input
        type="text"
        value={draft}
        disabled={disabled || saving}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={UI.veSomNotePlaceholder}
        className="min-w-0 flex-1 h-8 rounded-lg border border-line bg-surface-white px-2 text-3xs text-navy outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
        aria-label={UI.veSomNotePlaceholder}
      />
      <button
        type="button"
        disabled={disabled || saving || !draft.trim()}
        onClick={handleSave}
        className="shrink-0 h-8 px-2 rounded-lg btn-primary text-3xs font-semibold disabled:opacity-60"
      >
        {saving ? UI.loading : UI.veSomNoteSave}
      </button>
    </div>
  );
});

export default VeSomNoteField;
