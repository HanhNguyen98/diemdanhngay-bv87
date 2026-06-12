import { useState } from 'react';
import { api } from '../../api/client';
import { UI } from '../../constants/attendance';
import FlashBanner from '../shared/FlashBanner';
import { useFlashMessage } from '../../hooks/useFlashMessage';

const labelClass = 'block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1.5';
const inputClass =
  'w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus-visible:ring-2 focus-visible:ring-primary/25';

export default function ChangePasswordForm({ idPrefix = '' }) {
  const { flash, showSuccess, showError, clearFlash } = useFlashMessage();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      showError(UI.passwordMismatch);
      return;
    }
    if (form.newPassword.length < 6) {
      showError(UI.passwordMinLength);
      return;
    }

    setLoading(true);
    try {
      const result = await api.changePassword(
        form.currentPassword,
        form.newPassword,
        form.confirmPassword,
      );
      showSuccess(result.message || UI.passwordChangeSuccess);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-surface-white border border-line rounded-xl shadow-card p-5 lg:p-6">
      {flash && <FlashBanner flash={flash} onClose={clearFlash} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}current-password`}>
            {UI.currentPassword}
          </label>
          <input
            id={`${idPrefix}current-password`}
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
            className={inputClass}
            autoComplete="current-password"
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}new-password`}>
            {UI.newPassword}
          </label>
          <input
            id={`${idPrefix}new-password`}
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
          <label className={labelClass} htmlFor={`${idPrefix}confirm-password`}>
            {UI.confirmPassword}
          </label>
          <input
            id={`${idPrefix}confirm-password`}
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            className={inputClass}
            autoComplete="new-password"
            required
            minLength={6}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
        >
          {loading ? UI.savingPassword : UI.updatePassword}
        </button>
      </form>
    </section>
  );
}
