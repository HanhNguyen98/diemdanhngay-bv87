import { useState } from 'react';
import FormModal from '../shared/FormModal';
import InlineErrorBanner from '../shared/InlineErrorBanner';
import { ADMIN_UI } from '../../constants/admin';
import {
  STATUS_CATALOG_COLOR_OPTIONS,
  STATUS_CATALOG_ICON_OPTIONS,
} from '../../constants/statusCatalog';

const labelClass = 'block text-xs font-bold text-content-muted uppercase tracking-wide mb-1.5';
const inputClass =
  'w-full h-9 border border-gray-200 rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white';
const readOnlyClass = `${inputClass} bg-primary-light/30 text-gray-700 cursor-not-allowed`;

function slugifyCode(label) {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);
}

export default function StatusCatalogFormModal({ initial, items = [], onSave, onClose }) {
  const isEdit = Boolean(initial?.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    code: initial?.code || '',
    label: initial?.label || '',
    badgeLabel: initial?.badgeLabel || '',
    colorKey: initial?.colorKey || 'green',
    iconKey: initial?.iconKey || 'check',
    sortOrder: initial?.sortOrder ?? 0,
    active: initial?.active !== false,
    manualAllowed: initial?.manualAllowed === true,
    groupParent: initial?.groupParent === true,
    parentCode: initial?.parentCode || '',
  });

  const parentOptions = items.filter((item) => item.groupParent && item.code !== initial?.code);

  const handleLabelChange = (label) => {
    setForm((prev) => {
      const next = { ...prev, label };
      if (!isEdit && !prev.code.trim()) {
        next.code = slugifyCode(label);
      }
      if (!prev.badgeLabel.trim()) {
        next.badgeLabel = label.toUpperCase();
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.label.trim()) {
      setError('Tên hiển thị là bắt buộc');
      return;
    }
    if (!form.code.trim()) {
      setError('Mã trạng thái là bắt buộc');
      return;
    }
    if (!form.badgeLabel.trim()) {
      setError('Nhãn badge là bắt buộc');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        label: form.label.trim(),
        badgeLabel: form.badgeLabel.trim(),
        colorKey: form.colorKey,
        iconKey: form.iconKey,
        sortOrder: Number(form.sortOrder) || 0,
        active: form.active,
        manualAllowed: form.manualAllowed,
        groupParent: form.groupParent,
        parentCode: form.groupParent ? '' : form.parentCode || '',
      };
      await onSave(payload, isEdit ? initial.id : null);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      title={isEdit ? ADMIN_UI.statusCatalog.formTitleEdit : ADMIN_UI.statusCatalog.formTitleCreate}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
    >
      <InlineErrorBanner message={error} />

      <div>
        <label className={labelClass}>{ADMIN_UI.statusCatalog.form.code}</label>
        <input
          type="text"
          value={form.code}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
          className={isEdit ? readOnlyClass : inputClass}
          readOnly={isEdit}
          disabled={isEdit}
          placeholder="VD: DI_LAM"
          required
        />
      </div>

      <div>
        <label className={labelClass}>{ADMIN_UI.statusCatalog.form.label}</label>
        <input
          type="text"
          value={form.label}
          onChange={(e) => handleLabelChange(e.target.value)}
          className={inputClass}
          placeholder="VD: Đi làm"
          required
        />
      </div>

      <div>
        <label className={labelClass}>{ADMIN_UI.statusCatalog.form.badgeLabel}</label>
        <input
          type="text"
          value={form.badgeLabel}
          onChange={(e) => setForm((f) => ({ ...f, badgeLabel: e.target.value }))}
          className={inputClass}
          placeholder="VD: ĐI LÀM"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>{ADMIN_UI.statusCatalog.form.color}</label>
          <select
            value={form.colorKey}
            onChange={(e) => setForm((f) => ({ ...f, colorKey: e.target.value }))}
            className={inputClass}
          >
            {STATUS_CATALOG_COLOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{ADMIN_UI.statusCatalog.form.icon}</label>
          <select
            value={form.iconKey}
            onChange={(e) => setForm((f) => ({ ...f, iconKey: e.target.value }))}
            className={inputClass}
          >
            {STATUS_CATALOG_ICON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>{ADMIN_UI.statusCatalog.form.sortOrder}</label>
        <input
          type="number"
          min="0"
          value={form.sortOrder}
          onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={`${labelClass} mb-2`}>{ADMIN_UI.statusCatalog.form.manualAllowed}</label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.manualAllowed}
              onChange={(e) => setForm((f) => ({ ...f, manualAllowed: e.target.checked }))}
              className="rounded border-gray-300 text-primary focus:ring-primary/30"
            />
            Cho phép HEAD/Admin chấm thủ công
          </label>
        </div>
        <div>
          <label className={`${labelClass} mb-2`}>{ADMIN_UI.statusCatalog.form.groupParent}</label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.groupParent}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  groupParent: e.target.checked,
                  parentCode: e.target.checked ? '' : f.parentCode,
                }))
              }
              className="rounded border-gray-300 text-primary focus:ring-primary/30"
            />
            Chỉ làm nút nhóm / KPI cha
          </label>
        </div>
      </div>

      {!form.groupParent && (
        <div>
          <label className={labelClass}>{ADMIN_UI.statusCatalog.form.parentCode}</label>
          <select
            value={form.parentCode}
            onChange={(e) => setForm((f) => ({ ...f, parentCode: e.target.value }))}
            className={inputClass}
          >
            <option value="">{ADMIN_UI.statusCatalog.form.parentCodePlaceholder}</option>
            {parentOptions.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code} - {item.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={`${labelClass} mb-2`}>{ADMIN_UI.statusCatalog.form.active}</label>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            className="rounded border-gray-300 text-primary focus:ring-primary/30"
          />
          {form.active ? ADMIN_UI.statusCatalog.active : ADMIN_UI.statusCatalog.inactive}
        </label>
      </div>
    </FormModal>
  );
}
