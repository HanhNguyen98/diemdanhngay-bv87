import { useState, useEffect } from 'react';
import FormModal from '../shared/FormModal';
import InlineErrorBanner from '../shared/InlineErrorBanner';
import { ADMIN_UI } from '../../constants/admin';
import { adminApi } from '../../services/api';

const labelClass = 'block text-xs font-bold text-content-muted uppercase tracking-wide mb-1.5';
const inputClass =
  'w-full h-9 border border-gray-200 rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white';
const readOnlyClass = `${inputClass} bg-primary-light/30 text-gray-700 cursor-not-allowed`;

export default function DepartmentGroupFormModal({ initial, onSave, onClose }) {
  const isEdit = Boolean(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nextCode, setNextCode] = useState(null);
  const [codeLoading, setCodeLoading] = useState(!isEdit);
  const [form, setForm] = useState({
    groupName: initial?.groupName || '',
    sortOrder: initial?.sortOrder != null ? String(initial.sortOrder) : '',
  });

  useEffect(() => {
    if (isEdit) return;
    let cancelled = false;
    setCodeLoading(true);
    adminApi
      .getNextGroupCode()
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
  }, [isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.groupName.trim()) {
      setError(ADMIN_UI.departmentGroups.form.groupNameRequired);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        groupName: form.groupName.trim(),
        sortOrder: form.sortOrder ? parseInt(form.sortOrder, 10) : null,
      };
      await onSave(payload, isEdit ? initial.groupCode : null);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayCode = isEdit
    ? initial.groupCodeFormatted
    : nextCode?.codeFormatted || (codeLoading ? ADMIN_UI.form.loadingCode : '—');

  return (
    <FormModal
      title={
        isEdit
          ? ADMIN_UI.departmentGroups.formTitleEdit
          : ADMIN_UI.departmentGroups.formTitleCreate
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
      centerMobile
    >
      <InlineErrorBanner message={error} />
      <div>
        <label className={labelClass}>{ADMIN_UI.departmentGroups.columns.code}</label>
        <input type="text" value={displayCode} readOnly disabled className={readOnlyClass} />
      </div>
      <div>
        <label className={labelClass}>{ADMIN_UI.departmentGroups.form.groupName}</label>
        <input
          type="text"
          value={form.groupName}
          onChange={(e) => setForm((f) => ({ ...f, groupName: e.target.value }))}
          className={inputClass}
          required
        />
      </div>
      <div>
        <label className={labelClass}>{ADMIN_UI.departmentGroups.form.sortOrder}</label>
        <input
          type="number"
          min="0"
          value={form.sortOrder}
          onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
          className={inputClass}
          placeholder="Tự động nếu để trống"
        />
      </div>
    </FormModal>
  );
}
