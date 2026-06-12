import { useState } from 'react';
import { api } from '../api/client';
import { UI } from '../constants/attendance';
import { useAppBranding } from '../context/AppBrandingContext';
import LoginBrandingHeader from './shared/LoginBrandingHeader';
import InlineErrorBanner from './shared/InlineErrorBanner';

export default function LoginPage({ onLogin }) {
  const { branding } = useAppBranding();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await api.login(username, password);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { loginAvatarUrl, logoUrl, portalTitle } = branding;

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
      {loginAvatarUrl ? (
        <>
          <img
            src={loginAvatarUrl}
            alt=""
            className="fixed inset-0 w-full h-full object-cover"
            aria-hidden
          />
          <div className="fixed inset-0 bg-black/25" aria-hidden />
        </>
      ) : (
        <div className="fixed inset-0 bg-surface-page" aria-hidden />
      )}

      <div className="relative z-10 w-full max-w-md bg-surface-white rounded-2xl shadow-panel overflow-hidden">
        <LoginBrandingHeader
          showHeroImage={false}
          logoUrl={logoUrl}
          portalTitle={portalTitle}
          subtitle="Hệ thống Điểm danh"
        />

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5 border-t border-gray-100">
          <h2 className="text-xl font-bold text-navy pt-2">{UI.loginTitle}</h2>

          <InlineErrorBanner message={error} />

          <div>
            <label className="block text-sm font-medium text-content-muted mb-1">Tài khoản</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-line rounded-xl px-4 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              placeholder="admin hoặc truongphong02"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-muted mb-1">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line rounded-xl px-4 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-60 py-3 rounded-xl font-semibold"
          >
            {loading ? 'Đang đăng nhập...' : UI.loginTitle}
          </button>

          {import.meta.env.DEV && (
            <p className="text-xs text-content-muted text-center">
              Admin: admin / admin123 · Trưởng phòng: truongphong02 / head123
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
