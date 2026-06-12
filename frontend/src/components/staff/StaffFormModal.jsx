import { useMemo, useState, useEffect } from 'react';

import FormModal from '../shared/FormModal';
import InlineErrorBanner from '../shared/InlineErrorBanner';

import AvatarUpload from '../shared/AvatarUpload';

import SearchableSelect, { withLegacyOption } from '../shared/SearchableSelect';

import { ADMIN_UI } from '../../constants/admin';

import { STAFF_POSITION_OPTIONS, STAFF_RANK_OPTIONS } from '../../constants/staffOptions';

import { formatEmpCode } from '../../utils/formatters';

import { adminApi } from '../../services/api';



const labelClass = 'block text-xs font-bold text-content-muted uppercase tracking-wide mb-1.5';



const inputClass =

  'w-full h-9 border border-gray-200 rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white';



const readOnlyClass = `${inputClass} bg-primary-light/30 text-gray-700 cursor-not-allowed`;



const selectClass =

  'w-full h-9 border border-gray-200 rounded-lg pl-3 pr-16 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white';



export default function StaffFormModal({ initial, departments, onSave, onClose }) {

  const isEdit = Boolean(initial);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const [avatarError, setAvatarError] = useState('');

  const [nextCode, setNextCode] = useState(null);

  const [codeLoading, setCodeLoading] = useState(false);

  const [form, setForm] = useState({

    fullname: initial?.fullname || '',

    deptCode: initial?.deptCode != null ? String(initial.deptCode) : '',

    rankName: initial?.rankName || '',

    positionName: initial?.positionName || '',

    active: initial?.active !== false,

    avatarUrl: initial?.avatarUrl || null,

  });



  const rankOptions = useMemo(

    () => withLegacyOption(STAFF_RANK_OPTIONS, initial?.rankName),

    [initial?.rankName],

  );



  const positionOptions = useMemo(

    () => withLegacyOption(STAFF_POSITION_OPTIONS, initial?.positionName),

    [initial?.positionName],

  );



  useEffect(() => {

    if (isEdit || !form.deptCode) {

      setNextCode(null);

      return;

    }



    let cancelled = false;

    setCodeLoading(true);

    adminApi

      .getNextEmpCode(parseInt(form.deptCode, 10))

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

  }, [isEdit, form.deptCode]);



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

      await onSave(payload, isEdit ? initial.empCode : null);

      onClose();

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }

  };



  const displayCode = isEdit

    ? formatEmpCode(initial.empCode)

    : !form.deptCode

      ? '— Chọn Đơn vị trước —'

      : nextCode?.codeFormatted || (codeLoading ? ADMIN_UI.form.loadingCode : '—');



  return (

    <FormModal

      title={isEdit ? ADMIN_UI.staff.formTitleEdit : ADMIN_UI.staff.formTitleCreate}

      onClose={onClose}

      onSubmit={handleSubmit}

      loading={loading}

    >

      <InlineErrorBanner message={error} />

      <div>

        <label className={labelClass}>{ADMIN_UI.form.dept}</label>

        <select

          value={form.deptCode}

          onChange={(e) => setForm((f) => ({ ...f, deptCode: e.target.value }))}

          className={inputClass}

          required

          disabled={isEdit}

        >

          <option value="">— Chọn Đơn vị —</option>

          {departments.map((d) => (

            <option key={d.deptCode} value={d.deptCode}>

              [{d.deptCodeFormatted}] {d.deptName}

            </option>

          ))}

        </select>

      </div>

      <div>

        <label className={labelClass}>{ADMIN_UI.form.empCode}</label>

        <input type="text" value={displayCode} readOnly disabled className={readOnlyClass} />

      </div>

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

      <div className="grid grid-cols-2 gap-3">

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

      <AvatarUpload

        value={form.avatarUrl}

        onChange={(avatarUrl) => setForm((f) => ({ ...f, avatarUrl }))}

        onError={setAvatarError}

      />

      {avatarError && (

        <p className="text-sm text-danger-fg -mt-1">{avatarError}</p>

      )}

      <label className="flex items-center gap-2 cursor-pointer pt-0.5">

        <input

          type="checkbox"

          checked={form.active}

          onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}

          className="rounded border-gray-300 text-primary outline-none"

        />

        <span className="text-sm text-gray-700">{ADMIN_UI.staff.active}</span>

      </label>

    </FormModal>

  );

}


