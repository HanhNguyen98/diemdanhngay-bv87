import { useState, useEffect } from 'react';

import FormModal from '../shared/FormModal';
import InlineErrorBanner from '../shared/InlineErrorBanner';

import { ADMIN_UI } from '../../constants/admin';

import { formatDeptCode } from '../../utils/formatters';

import { adminApi } from '../../services/api';

const labelClass = 'block text-xs font-bold text-content-muted uppercase tracking-wide mb-1.5';

const inputClass =
  'w-full h-9 border border-gray-200 rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white';

const readOnlyClass = `${inputClass} bg-primary-light/30 text-gray-700 cursor-not-allowed`;

export default function DepartmentFormModal({
  initial,
  staffList = [],
  groups = [],
  defaultGroupCode = null,
  onSave,
  onClose,
}) {
  const isEdit = Boolean(initial);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const [nextCode, setNextCode] = useState(null);

  const [codeLoading, setCodeLoading] = useState(!isEdit);

  const [form, setForm] = useState({
    deptName: initial?.deptName || '',
    unitCode: initial?.unitCode || '',
    groupCode:
      initial?.groupCode != null
        ? String(initial.groupCode)
        : defaultGroupCode != null
          ? String(defaultGroupCode)
          : '',
    headEmpCode: initial?.headEmpCode != null ? String(initial.headEmpCode) : '',
  });

  useEffect(() => {
    if (isEdit) return;

    let cancelled = false;

    setCodeLoading(true);

    adminApi
      .getNextDeptCode()
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

    if (!form.deptName.trim()) {
      setError('Tên Đơn vị là bắt buộc');
      return;
    }
    if (!form.groupCode) {
      setError('Nhóm Đơn vị là bắt buộc');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        deptName: form.deptName.trim(),
        unitCode: form.unitCode.trim() || null,
        groupCode: parseInt(form.groupCode, 10),
        location: isEdit ? initial?.location ?? null : null,
        headEmpCode: form.headEmpCode ? parseInt(form.headEmpCode, 10) : null,
        locationImageUrl: isEdit ? initial?.locationImageUrl ?? null : null,
      };

      await onSave(payload, isEdit ? initial.deptCode : null);

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayCode = isEdit
    ? formatDeptCode(initial.deptCode)
    : nextCode?.codeFormatted || (codeLoading ? ADMIN_UI.form.loadingCode : '—');

  const activeStaff = staffList.filter((staff) => staff.active !== false);

  const eligibleHeads = isEdit
    ? activeStaff.filter((staff) => staff.deptCode === initial.deptCode)
    : [];

  return (
    <FormModal
      title={isEdit ? ADMIN_UI.departments.formTitleEdit : ADMIN_UI.departments.formTitleCreate}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
    >
      <InlineErrorBanner message={error} />

      <div>
        <label className={labelClass}>{ADMIN_UI.form.deptCode}</label>
        <input type="text" value={displayCode} readOnly disabled className={readOnlyClass} />
      </div>

      <div>
        <label className={labelClass}>{ADMIN_UI.form.groupCode}</label>
        <select
          value={form.groupCode}
          onChange={(e) => setForm((f) => ({ ...f, groupCode: e.target.value }))}
          className={inputClass}
          required
        >
          <option value="">{ADMIN_UI.form.groupSelectPlaceholder}</option>
          {groups.map((g) => (
            <option key={g.groupCode} value={g.groupCode}>
              {g.groupName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>{ADMIN_UI.form.unitCode}</label>
        <input
          type="text"
          value={form.unitCode}
          onChange={(e) => setForm((f) => ({ ...f, unitCode: e.target.value }))}
          className={inputClass}
          placeholder="C11"
          maxLength={20}
        />
      </div>

      <div>
        <label className={labelClass}>{ADMIN_UI.form.deptName}</label>
        <input
          type="text"
          value={form.deptName}
          onChange={(e) => setForm((f) => ({ ...f, deptName: e.target.value }))}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className={labelClass}>{ADMIN_UI.form.headName}</label>
        {isEdit ? (
          <select
            value={form.headEmpCode}
            onChange={(e) => setForm((f) => ({ ...f, headEmpCode: e.target.value }))}
            className={inputClass}
          >
            <option value="">{ADMIN_UI.form.headSelectPlaceholder}</option>
            {eligibleHeads.map((staff) => (
              <option key={staff.empCode} value={staff.empCode}>
                {staff.fullname}
                {staff.rankName ? ` — ${staff.rankName}` : ''}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-content-muted">{ADMIN_UI.form.headSelectHintCreate}</p>
        )}
      </div>
    </FormModal>
  );
}
