import { useMemo, useState } from 'react';

import FormModal from '../shared/FormModal';
import InlineErrorBanner from '../shared/InlineErrorBanner';
import SearchableSelect from '../shared/SearchableSelect';
import StaffTransferHeadRevokeNotice from './StaffTransferHeadRevokeNotice';

import { ADMIN_UI } from '../../constants/admin';

const labelClass = 'block text-xs font-bold text-content-muted uppercase tracking-wide mb-1.5';
const selectClass =
  'w-full h-9 border border-gray-200 rounded-lg pl-3 pr-16 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white';

/**
 * Admin-only transfer modal — SPEC_ADMIN §7.3 P6-Adminc (POST …/transfer only).
 */
export default function StaffTransferModal({ staff, departments = [], onSave, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    deptCode: '',
    transferReason: '',
    revokeHeadOnTransfer: false,
  });

  const initialDeptCode = staff?.deptCode != null ? String(staff.deptCode) : '';
  const requiresHeadRevoke = Boolean(
    staff?.hasActiveHeadAccount || staff?.isDepartmentCatalogHead,
  );
  const initialDeptLabel = staff ? `[${staff.deptCodeFormatted}] ${staff.deptName}` : '';

  const activeDepartments = useMemo(
    () =>
      departments.filter(
        (d) => d.active !== false && String(d.deptCode) !== initialDeptCode,
      ),
    [departments, initialDeptCode],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const deptCode = parseInt(form.deptCode, 10);
    if (!deptCode) {
      setError('Vui lòng chọn Đơn vị đích');
      return;
    }
    if (!form.transferReason.trim()) {
      setError(ADMIN_UI.staff.transferReasonRequired);
      return;
    }
    if (requiresHeadRevoke && !form.revokeHeadOnTransfer) {
      setError(ADMIN_UI.staff.transferHeadRevokeRequired);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        deptCode,
        transferReason: form.transferReason.trim(),
      };
      if (requiresHeadRevoke) {
        payload.revokeHeadOnTransfer = true;
      }
      await onSave(payload, staff.empCode);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!staff) return null;

  return (
    <FormModal
      title={ADMIN_UI.staff.transferDeptModalTitle}
      subtitle={ADMIN_UI.staff.transferDeptModalSubtitle(staff.fullname, staff.empCodeFormatted)}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
      size="lg"
      centerMobile
      submitLabel={ADMIN_UI.staff.transferDeptSubmit}
    >
      <InlineErrorBanner message={error} />

      <div className="space-y-4">
        <div>
          <p className="text-xs text-content-muted mb-1">{ADMIN_UI.staff.transferDeptFromLabel}</p>
          <p className="text-sm font-semibold text-navy">{initialDeptLabel}</p>
        </div>

        <div>
          <label className={labelClass}>
            {ADMIN_UI.staff.transferDeptToLabel}
            <span className="text-danger-fg ml-0.5" aria-hidden="true">
              *
            </span>
          </label>
          <SearchableSelect
            value={form.deptCode}
            onChange={(deptCode) =>
              setForm((f) => ({
                ...f,
                deptCode,
                revokeHeadOnTransfer: false,
              }))
            }
            options={activeDepartments.map((d) => ({
              value: String(d.deptCode),
              label: `[${d.deptCodeFormatted}] ${d.deptName}`,
            }))}
            placeholder={ADMIN_UI.form.deptPlaceholder}
            clearLabel={ADMIN_UI.form.selectClear}
            emptyLabel={ADMIN_UI.form.selectEmpty}
            inputClassName={selectClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            {ADMIN_UI.staff.transferReason}
            <span className="text-danger-fg ml-0.5" aria-hidden="true">
              *
            </span>
          </label>
          <textarea
            value={form.transferReason}
            onChange={(e) => setForm((f) => ({ ...f, transferReason: e.target.value }))}
            className="w-full min-h-[72px] border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white resize-y"
            placeholder={ADMIN_UI.staff.transferReasonPlaceholder}
            required
          />
        </div>

        <p className="text-xs text-content-muted">{ADMIN_UI.staff.transferDeptFingerprintHint}</p>

        {requiresHeadRevoke && (
          <StaffTransferHeadRevokeNotice
            deptLabel={initialDeptLabel}
            username={staff?.headAccountUsername}
            checked={form.revokeHeadOnTransfer}
            onChange={(revokeHeadOnTransfer) =>
              setForm((f) => ({ ...f, revokeHeadOnTransfer }))
            }
          />
        )}
      </div>
    </FormModal>
  );
}
