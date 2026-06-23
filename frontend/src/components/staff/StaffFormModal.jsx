import { useMemo, useState } from 'react';

import FormModal from '../shared/FormModal';
import InlineErrorBanner from '../shared/InlineErrorBanner';
import AvatarUpload from '../shared/AvatarUpload';
import SearchableSelect, { withLegacyOption } from '../shared/SearchableSelect';
import StaffTransferHeadRevokeNotice from './StaffTransferHeadRevokeNotice';

import { ADMIN_UI } from '../../constants/admin';
import { useStaffCatalogOptions } from '../../hooks/useStaffCatalogOptions';

const labelClass = 'block text-xs font-bold text-content-muted uppercase tracking-wide mb-1.5';
const inputClass =
  'w-full h-9 border border-gray-200 rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white';
const selectClass =
  'w-full h-9 border border-gray-200 rounded-lg pl-3 pr-16 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white';
const sectionTitleClass = 'text-xs font-bold text-navy uppercase tracking-wide pt-1';

export default function StaffFormModal({ initial, departments, onSave, onClose }) {
  const isEdit = Boolean(initial);
  const { rankNames, positionNames } = useStaffCatalogOptions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [form, setForm] = useState({
    fullname: initial?.fullname || '',
    deptCode: initial?.deptCode != null ? String(initial.deptCode) : '',
    rankName: initial?.rankName || '',
    positionName: initial?.positionName || '',
    active: initial?.active !== false,
    avatarUrl: initial?.avatarUrl || null,
    transferReason: '',
    revokeHeadOnTransfer: false,
  });

  const initialDeptCode = initial?.deptCode != null ? String(initial.deptCode) : '';
  const isDeptChanged = isEdit && form.deptCode !== initialDeptCode;
  const requiresHeadRevoke = Boolean(
    initial?.hasActiveHeadAccount || initial?.isDepartmentCatalogHead,
  );
  const initialDeptLabel = initial
    ? `[${initial.deptCodeFormatted}] ${initial.deptName}`
    : '';

  const activeDepartments = useMemo(
    () => departments.filter((d) => d.active !== false),
    [departments],
  );

  const rankOptions = useMemo(
    () => withLegacyOption(rankNames, initial?.rankName),
    [rankNames, initial?.rankName],
  );

  const positionOptions = useMemo(
    () => withLegacyOption(positionNames, initial?.positionName),
    [positionNames, initial?.positionName],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (avatarError) {
      setError(avatarError);
      return;
    }

    const deptCode = parseInt(form.deptCode, 10);
    if (!form.fullname.trim()) {
      setError('Họ tên là bắt buộc');
      return;
    }
    if (!deptCode) {
      setError('Vui lòng chọn Đơn vị');
      return;
    }
    if (isDeptChanged && !form.transferReason.trim()) {
      setError(ADMIN_UI.staff.transferReasonRequired);
      return;
    }
    if (isDeptChanged && requiresHeadRevoke && !form.revokeHeadOnTransfer) {
      setError(ADMIN_UI.staff.transferHeadRevokeRequired);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullname: form.fullname.trim(),
        deptCode,
        rankName: form.rankName || null,
        positionName: form.positionName || null,
        active: form.active,
        avatarUrl: form.avatarUrl,
      };

      if (isDeptChanged) {
        payload.transferReason = form.transferReason.trim();
        if (requiresHeadRevoke) {
          payload.revokeHeadOnTransfer = true;
        }
      }

      await onSave(payload, isEdit ? initial.empCode : null);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeptChange = (deptCode) => {
    setForm((f) => ({
      ...f,
      deptCode,
      transferReason: '',
      revokeHeadOnTransfer: false,
    }));
  };

  const deptField = (
    <div>
      <label className={labelClass}>{ADMIN_UI.form.dept}</label>
      <select
        value={form.deptCode}
        onChange={(e) => handleDeptChange(e.target.value)}
        className={inputClass}
        required
      >
        <option value="">— Chọn Đơn vị —</option>
        {activeDepartments.map((d) => (
          <option key={d.deptCode} value={d.deptCode}>
            [{d.deptCodeFormatted}] {d.deptName}
          </option>
        ))}
      </select>
    </div>
  );

  const identityFields = (
    <>
      <div>
        <label className={labelClass}>{ADMIN_UI.form.fullname}</label>
        <input
          type="text"
          value={form.fullname}
          onChange={(e) => setForm((f) => ({ ...f, fullname: e.target.value }))}
          placeholder={ADMIN_UI.form.fullnamePlaceholder}
          className={inputClass}
          required
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>{ADMIN_UI.form.rank}</label>
          <SearchableSelect
            value={form.rankName}
            onChange={(rankName) => setForm((f) => ({ ...f, rankName }))}
            options={rankOptions}
            placeholder={ADMIN_UI.form.rankPlaceholder}
            clearLabel={ADMIN_UI.form.selectClear}
            emptyLabel={ADMIN_UI.form.selectEmpty}
            inputClassName={selectClass}
          />
        </div>
        <div>
          <label className={labelClass}>{ADMIN_UI.form.position}</label>
          <SearchableSelect
            value={form.positionName}
            onChange={(positionName) => setForm((f) => ({ ...f, positionName }))}
            options={positionOptions}
            placeholder={ADMIN_UI.form.positionPlaceholder}
            clearLabel={ADMIN_UI.form.selectClear}
            emptyLabel={ADMIN_UI.form.selectEmpty}
            inputClassName={selectClass}
          />
        </div>
      </div>
    </>
  );

  const transferSection = (
    <div className="space-y-3.5 rounded-xl border border-line bg-surface-page/60 p-4 lg:h-full">
      <p className={`${sectionTitleClass} pt-0`}>{ADMIN_UI.staff.transferSectionTitle}</p>

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
          className="w-full min-h-[72px] lg:min-h-[56px] border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white resize-y"
          placeholder={ADMIN_UI.staff.transferReasonPlaceholder}
          required
        />
       
      </div>

      {requiresHeadRevoke && (
        <StaffTransferHeadRevokeNotice
          deptLabel={initialDeptLabel}
          username={initial?.headAccountUsername}
          checked={form.revokeHeadOnTransfer}
          onChange={(revokeHeadOnTransfer) =>
            setForm((f) => ({ ...f, revokeHeadOnTransfer }))
          }
        />
      )}
    </div>
  );

  const avatarAndStatus = (
    <>
      <AvatarUpload
        value={form.avatarUrl}
        onChange={(avatarUrl) => setForm((f) => ({ ...f, avatarUrl }))}
        onError={setAvatarError}
      />

      {avatarError && <p className="text-sm text-danger-fg -mt-1">{avatarError}</p>}

      <label className="flex items-center gap-2 cursor-pointer pt-0.5">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          className="rounded border-gray-300 text-primary outline-none"
        />
        <span className="text-sm text-gray-700">{ADMIN_UI.staff.active}</span>
      </label>
    </>
  );

  const modalSize = isDeptChanged ? 'xl' : '2xl';

  return (
    <FormModal
      title={isEdit ? ADMIN_UI.staff.formTitleEdit : ADMIN_UI.staff.formTitleCreate}
      subtitle={isDeptChanged ? ADMIN_UI.staff.formSubtitleEditTransfer : undefined}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
      size={modalSize}
      centerMobile
      submitLabel={isEdit ? ADMIN_UI.staff.formSaveChanges : undefined}
    >
      <InlineErrorBanner message={error} />

      {isDeptChanged ? (
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-stretch space-y-3.5 lg:space-y-0">
          <div className="space-y-3.5">
            <p className={`${sectionTitleClass} pt-0`}>{ADMIN_UI.staff.basicSectionTitle}</p>
            {deptField}
            {identityFields}
            {avatarAndStatus}
          </div>
          <div>{transferSection}</div>
        </div>
      ) : (
        <>
          {deptField}
          {identityFields}
          {avatarAndStatus}
        </>
      )}
    </FormModal>
  );
}
