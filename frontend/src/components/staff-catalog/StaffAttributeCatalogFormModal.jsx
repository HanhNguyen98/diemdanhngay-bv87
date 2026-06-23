import { useState, useEffect } from 'react';
import FormModal from '../shared/FormModal';
import InlineErrorBanner from '../shared/InlineErrorBanner';
import { ADMIN_UI } from '../../constants/admin';
import { adminApi } from '../../services/api';

const labelClass = 'block text-xs font-bold text-content-muted uppercase tracking-wide mb-1.5';
const inputClass =
  'w-full h-9 border border-gray-200 rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white';
const readOnlyClass = `${inputClass} bg-primary-light/30 text-gray-700 cursor-not-allowed`;

export default function StaffAttributeCatalogFormModal({ config, initial, onSave, onClose }) {
  const ui = config.ui();
  const isEdit = Boolean(initial?.[config.codeField]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nextCode, setNextCode] = useState(null);
  const [codeLoading, setCodeLoading] = useState(!isEdit);
  const [form, setForm] = useState({
    name: initial?.[config.nameField] || '',
    sortOrder: initial?.sortOrder != null ? String(initial.sortOrder) : '',
    active: initial?.active !== false,
  });

  useEffect(() => {
    if (isEdit) return;
    let cancelled = false;
    setCodeLoading(true);
    config
      .getNextCode(adminApi)
      .then((data) => {
        if (!cancelled) setNextCode(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setCodeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isEdit, config]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError(ui.form.nameRequired);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        [config.nameField]: form.name.trim(),
        sortOrder: form.sortOrder ? parseInt(form.sortOrder, 10) : null,
        active: form.active,
      };
      await onSave(payload, isEdit ? initial[config.codeField] : null);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayCode = isEdit
    ? initial[config.codeFormattedField]
    : nextCode?.codeFormatted || (codeLoading ? ADMIN_UI.form.loadingCode : '—');

  return (
    <FormModal
      title={isEdit ? ui.formTitleEdit : ui.formTitleCreate}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
      centerMobile
    >
      {error && <InlineErrorBanner message={error} className="mb-3" />}

      <div className="mb-4">
        <label className={labelClass}>{ui.form.code}</label>
        <input type="text" readOnly value={displayCode} className={readOnlyClass} />
      </div>

      <div className="mb-4">
        <label className={labelClass}>{ui.form.name}</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className={inputClass}
          autoFocus
        />
      </div>

      <div className="mb-4">
        <label className={labelClass}>{ui.form.sortOrder}</label>
        <input
          type="number"
          min="0"
          value={form.sortOrder}
          onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
          className={inputClass}
        />
      </div>

      <div>
        <label className={`${labelClass} mb-2`}>{ui.form.active}</label>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            className="rounded border-gray-300 text-primary focus:ring-primary/30"
          />
          <span className="text-sm text-gray-700">
            {form.active ? ui.active : ui.inactive}
          </span>
        </label>
      </div>
    </FormModal>
  );
}
