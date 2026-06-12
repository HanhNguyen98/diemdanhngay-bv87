import { useState } from 'react';
import FormModal from '../shared/FormModal';
import InlineErrorBanner from '../shared/InlineErrorBanner';
import { ADMIN_UI } from '../../constants/admin';

const labelClass = 'block text-xs font-bold text-content-muted uppercase tracking-wide mb-1.5';
const inputClass =
  'w-full h-9 border border-gray-200 rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white';

export default function ResetPasswordModal({ account, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword.length < 6) {
      setError(ADMIN_UI.accounts.resetPasswordMinLength);
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError(ADMIN_UI.accounts.resetPasswordMismatch);
      return;
    }
    setLoading(true);
    try {
      await onConfirm(form.newPassword, form.confirmPassword);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      title={ADMIN_UI.accounts.resetPasswordTitle}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
      submitLabel={ADMIN_UI.accounts.resetPasswordSubmit}
    >
      <p className="text-sm text-content-muted -mt-1 mb-1">
        {ADMIN_UI.accounts.resetPasswordDesc(account?.fullname, account?.username)}
      </p>
      <InlineErrorBanner message={error} />
      <div>
        <label className={labelClass}>{ADMIN_UI.accounts.form.password}</label>
        <input
          type="password"
          value={form.newPassword}
          onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
          className={inputClass}
          autoComplete="new-password"
          required
          minLength={6}
        />
      </div>
      <div>
        <label className={labelClass}>{ADMIN_UI.accounts.resetPasswordConfirm}</label>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
          className={inputClass}
          autoComplete="new-password"
          required
          minLength={6}
        />
      </div>
    </FormModal>
  );
}
