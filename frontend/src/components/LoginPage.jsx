import { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { api } from '../api/client';
import { UI } from '../constants/attendance';
import { useAppBranding } from '../context/AppBrandingContext';
import LoginBrandingHeader from './shared/LoginBrandingHeader';
import InlineErrorBanner from './shared/InlineErrorBanner';

const INPUT_CLASS =
  'w-full min-w-0 border border-line rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 placeholder:text-content-muted/70';

const ICON_BTN_CLASS =
  'w-7 h-7 shrink-0 rounded-md flex items-center justify-center text-content-muted hover:text-gray-800 hover:bg-neutral transition-colors';

export default function LoginPage({ onLogin }) {
  const { branding } = useAppBranding();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="relative min-h-[100dvh] max-w-full overflow-x-hidden overflow-y-auto overscroll-y-contain flex items-start sm:items-center justify-center px-3 py-3 sm:px-4 sm:py-8">
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

      <div className="relative z-10 w-full max-w-md my-auto sm:my-0 bg-surface-white rounded-xl sm:rounded-2xl shadow-panel overflow-hidden">
        <LoginBrandingHeader
          showHeroImage={false}
          logoUrl={logoUrl}
          portalTitle={portalTitle}
          subtitle="Chương trình điểm danh"
        />

        <form
          onSubmit={handleSubmit}
          className="px-4 pb-4 pt-0 sm:px-8 sm:pb-8 space-y-3 sm:space-y-5 border-t border-gray-100"
        >
          <h2 className="text-lg sm:text-xl font-bold text-navy pt-1 sm:pt-2">{UI.loginTitle}</h2>

          <InlineErrorBanner message={error} />

          <div>
            <label className="block text-3xs sm:text-sm font-medium text-content-muted mb-1">
              Tài khoản
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`${INPUT_CLASS} ${username ? 'pr-10' : ''}`}
                placeholder="admin / truongphong02"
                autoComplete="username"
                required
              />
              {username && (
                <button
                  type="button"
                  onClick={() => setUsername('')}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 ${ICON_BTN_CLASS}`}
                  aria-label="Xóa tài khoản"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-3xs sm:text-sm font-medium text-content-muted mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${INPUT_CLASS} ${password ? 'pr-[4.5rem]' : 'pr-10'}`}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                {password && (
                  <button
                    type="button"
                    onClick={() => setPassword('')}
                    className={ICON_BTN_CLASS}
                    aria-label="Xóa mật khẩu"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className={ICON_BTN_CLASS}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-60 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold"
          >
            {loading ? 'Đang đăng nhập...' : UI.loginTitle}
          </button>

          {import.meta.env.DEV && (
            <p className="text-3xs sm:text-xs text-content-muted text-center leading-relaxed px-0.5">
              Admin: admin / admin123
              <br className="sm:hidden" />
              <span className="hidden sm:inline"> · </span>
              Trưởng phòng: truongphong02 / head123
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
