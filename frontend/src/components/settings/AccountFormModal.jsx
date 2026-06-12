import { useMemo, useState } from 'react';
import FormModal from '../shared/FormModal';
import InlineErrorBanner from '../shared/InlineErrorBanner';
import SearchableSelect from '../shared/SearchableSelect';
import { ADMIN_UI } from '../../constants/admin';

const labelClass = 'block text-xs font-bold text-content-muted uppercase tracking-wide mb-1.5';
const inputClass =
  'w-full h-9 border border-gray-200 rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white';
const readOnlyClass = `${inputClass} bg-primary-light/30 text-gray-700 cursor-not-allowed`;
const selectClass =
  'w-full h-9 border border-gray-200 rounded-lg pl-3 pr-16 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white';

const ROLES = [
  { value: 'ADMIN', label: 'Quản trị viên' },
  { value: 'HEAD', label: 'TRƯỞNG Đơn vị' },
];

function staffOptionLabel(staff) {
  const rank = staff.rankName ? ` — ${staff.rankName}` : '';
  const dept = staff.deptName
    ? ` — [${staff.deptCodeFormatted}] ${staff.deptName}`
    : '';
  return `[${staff.empCodeFormatted}] ${staff.fullname}${rank}${dept}`;
}

export default function AccountFormModal({
  initial,
  departments,
  staffList = [],
  accounts = [],
  onSave,
  onClose,
}) {
  const isEdit = Boolean(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    username: initial?.username || '',
    password: '',
    fullname: initial?.fullname || '',
    role: initial?.role || 'HEAD',
    empCode: initial?.empCode != null ? String(initial.empCode) : '',
    deptCode: initial?.deptCode != null ? String(initial.deptCode) : '',
    active: initial?.active !== false,
  });

  const activeStaff = useMemo(() => staffList.filter((s) => s.active), [staffList]);

  const eligibleStaff = useMemo(() => {
    const takenDeptCodes = new Set(
      accounts
        .filter(
          (a) =>
            a.active &&
            a.role === 'HEAD' &&
            a.deptCode != null &&
            a.id !== initial?.id,
        )
        .map((a) => a.deptCode),
    );
    const takenEmpCodes = new Set(
      accounts
        .filter((a) => a.active && a.empCode != null && a.id !== initial?.id)
        .map((a) => a.empCode),
    );

    let list = activeStaff.filter(
      (s) =>
        (!takenEmpCodes.has(s.empCode) || s.empCode === initial?.empCode) &&
        (!takenDeptCodes.has(s.deptCode) || s.deptCode === initial?.deptCode),
    );

    if (
      initial?.empCode != null &&
      !list.some((s) => s.empCode === initial.empCode)
    ) {
      const legacy =
        staffList.find((s) => s.empCode === initial.empCode) ||
        (initial.empCodeFormatted
          ? {
            empCode: initial.empCode,
            empCodeFormatted: initial.empCodeFormatted,
            fullname: initial.fullname,
            deptCode: initial.deptCode,
            deptCodeFormatted: initial.deptCodeFormatted,
            deptName: initial.deptName,
            rankName: '',
            active: false,
          }
          : null);
      if (legacy) {
        list = [legacy, ...list];
      }
    }

    return list;
  }, [activeStaff, accounts, initial, staffList]);

  const staffByLabel = useMemo(
    () => new Map(eligibleStaff.map((s) => [staffOptionLabel(s), s])),
    [eligibleStaff],
  );

  const staffOptions = useMemo(
    () => eligibleStaff.map(staffOptionLabel),
    [eligibleStaff],
  );

  const selectedStaff = useMemo(() => {
    if (!form.empCode) return null;
    return (
      eligibleStaff.find((s) => String(s.empCode) === form.empCode) ||
      staffList.find((s) => String(s.empCode) === form.empCode) ||
      null
    );
  }, [form.empCode, eligibleStaff, staffList]);

  const selectedStaffLabel = selectedStaff ? staffOptionLabel(selectedStaff) : '';

  const headDeptDisplay = useMemo(() => {
    if (selectedStaff?.deptName) {
      return `[${selectedStaff.deptCodeFormatted}] ${selectedStaff.deptName}`;
    }
    if (form.deptCode) {
      const dept = departments.find((d) => String(d.deptCode) === form.deptCode);
      if (dept) {
        return `[${dept.deptCodeFormatted}] ${dept.deptName}`;
      }
    }
    return '—';
  }, [selectedStaff, form.deptCode, departments]);

  const handleRoleChange = (role) => {
    setForm((f) => ({
      ...f,
      role,
      empCode: role === 'HEAD' ? f.empCode : '',
      deptCode: role === 'HEAD' ? f.deptCode : '',
      fullname: role === 'ADMIN' ? f.fullname || initial?.fullname || '' : f.fullname,
    }));
  };

  const handleEmployeeSelect = (label) => {
    const staff = staffByLabel.get(label);
    if (!staff) {
      setForm((f) => ({ ...f, empCode: '', deptCode: '', fullname: '' }));
      return;
    }
    setForm((f) => ({
      ...f,
      empCode: String(staff.empCode),
      deptCode: String(staff.deptCode),
      fullname: staff.fullname,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim()) {
      setError('Tên đăng nhập là bắt buộc');
      return;
    }
    if (!isEdit && !form.password.trim()) {
      setError('Mật khẩu là bắt buộc khi tạo tài khoản');
      return;
    }
    if (form.role === 'HEAD') {
      if (!form.empCode) {
        setError(ADMIN_UI.accounts.form.employeeRequired);
        return;
      }
    } else if (!form.fullname.trim()) {
      setError('Họ và tên là bắt buộc');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        username: form.username.trim(),
        role: form.role,
        active: form.active,
      };
      if (form.role === 'HEAD') {
        payload.empCode = parseInt(form.empCode, 10);
        payload.deptCode = parseInt(form.deptCode, 10);
        payload.fullname = form.fullname.trim();
      } else {
        payload.deptCode = null;
        payload.empCode = null;
        payload.fullname = form.fullname.trim();
      }
      if (form.password.trim()) {
        payload.password = form.password;
      }
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
      title={isEdit ? ADMIN_UI.accounts.formTitleEdit : ADMIN_UI.accounts.formTitleCreate}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
    >
      <InlineErrorBanner message={error} />
      <div>
        <label className={labelClass}>{ADMIN_UI.accounts.form.username}</label>
        <input
          type="text"
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          className={inputClass}
          required
          autoComplete="off"
        />
      </div>
      <div>
        <label className={labelClass}>{ADMIN_UI.accounts.form.password}</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className={inputClass}
          placeholder={isEdit ? ADMIN_UI.accounts.form.passwordEditHint : ''}
          autoComplete="new-password"
        />
      </div>
      <div>
        <label className={labelClass}>{ADMIN_UI.accounts.form.role}</label>
        <select
          value={form.role}
          onChange={(e) => handleRoleChange(e.target.value)}
          className={inputClass}
        >
          {ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </div>
      {form.role === 'HEAD' ? (
        <>
          <div>
            <label className={labelClass}>{ADMIN_UI.accounts.form.employee}</label>
            <SearchableSelect
              value={selectedStaffLabel}
              onChange={handleEmployeeSelect}
              options={staffOptions}
              placeholder={ADMIN_UI.accounts.form.employeeSelectPlaceholder}
              inputClassName={selectClass}
            />
          </div>
          <div>
            <label className={labelClass}>{ADMIN_UI.accounts.form.fullnameFromEmployee}</label>
            <input
              type="text"
              value={form.fullname}
              readOnly
              disabled
              className={readOnlyClass}
            />
          </div>
          <div>
            <label className={labelClass}>{ADMIN_UI.accounts.form.deptFromEmployee}</label>
            <input
              type="text"
              value={headDeptDisplay}
              readOnly
              disabled
              className={readOnlyClass}
            />
          </div>
        </>
      ) : (
        <div>
          <label className={labelClass}>{ADMIN_UI.accounts.form.fullname}</label>
          <input
            type="text"
            value={form.fullname}
            onChange={(e) => setForm((f) => ({ ...f, fullname: e.target.value }))}
            className={inputClass}
            required
          />
        </div>
      )}
      <label className="flex items-center gap-2 cursor-pointer pt-0.5">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          className="rounded border-gray-300 text-primary outline-none"
        />
        <span className="text-sm text-gray-700">{ADMIN_UI.accounts.active}</span>
      </label>
    </FormModal>
  );
}
