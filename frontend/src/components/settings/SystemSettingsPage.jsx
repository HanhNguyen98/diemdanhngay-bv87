import AvatarUpload from '../shared/AvatarUpload';
import AppLogo from '../shared/AppLogo';
import FlashBanner from '../shared/FlashBanner';
import LoginBrandingHeader from '../shared/LoginBrandingHeader';
import AdminSubmenuBreadcrumb from '../admin/sections/AdminSubmenuBreadcrumb';
import { ADMIN_UI } from '../../constants/admin';
import { useAppBranding } from '../../context/AppBrandingContext';
import { useSystemSettings } from '../../hooks/useSystemSettings';

const labelClass = 'block text-xs font-bold text-content-muted uppercase tracking-wide mb-1.5';
const subLabelClass = 'block text-xs font-semibold text-gray-700 mb-1';
const inputClass =
  'w-full h-9 border border-gray-200 rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white';
const timeInputClass =
  'h-9 border border-gray-200 rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white';

function SettingsSection({ title,  children, className = '' }) {
  return (
    <section
      className={`bg-surface-white border border-gray-200 rounded-xl shadow-card p-5 flex flex-col gap-4 ${className}`}
    >
   <h2 className="admin-section-title">{title}</h2>
      {children}
    </section>
  );
}

function BrandingSubField({ title, hint, children, error }) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div>
        <p className={subLabelClass}>{title}</p>
        {hint && <p className="text-xs text-content-muted">{hint}</p>}
      </div>
      {children}
      {error && <p className="text-sm text-danger-fg">{error}</p>}
    </div>
  );
}

export default function SystemSettingsPage() {
  const { branding } = useAppBranding();
  const {
    portalTitle,
    setPortalTitle,
    logoUrl,
    setLogoUrl,
    loginAvatarUrl,
    setLoginAvatarUrl,
    attendanceLockTime,
    setAttendanceLockTime,
    attendanceReminderTime,
    setAttendanceReminderTime,
    attendanceOpenTime,
    setLogoError,
    logoError,
    setLoginAvatarError,
    loginAvatarError,
    loading,
    saving,
    handleSave,
    flash,
    clearFlash,
  } = useSystemSettings();

  const { system } = ADMIN_UI.settings;

  if (loading) {
    return (
      <>
        <AdminSubmenuBreadcrumb parentLabelKey="settings" currentLabelKey="settingsSystem" />
        <div className="w-full flex items-center justify-center py-16 text-sm text-content-muted">
          Đang tải cấu hình...
        </div>
      </>
    );
  }

  return (
    <>
      <AdminSubmenuBreadcrumb parentLabelKey="settings" currentLabelKey="settingsSystem" />
      {flash && <FlashBanner flash={flash} onClose={clearFlash} />}
      <div className="w-full space-y-4">
        <div className="grid grid-cols-1 gap-4 w-full">
          <SettingsSection title={`1. ${system.groupSystemName}`}>
            <div className="max-w-xl">
              <label className={labelClass}>{system.portalTitle}</label>
              <input
                type="text"
                value={portalTitle}
                onChange={(e) => setPortalTitle(e.target.value)}
                className={inputClass}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            title={`2. ${system.groupBranding}`}
           
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <BrandingSubField
              
              
                error={loginAvatarError}
              >
                <AvatarUpload
                  value={loginAvatarUrl}
                  onChange={setLoginAvatarUrl}
                  onError={setLoginAvatarError}
                  label={system.loginAvatarUpload}
                  selectedLabel={system.loginAvatarSelected}
                  removeLabel={system.loginAvatarRemove}
                  previewAlt="Ảnh đại diện đăng nhập"
                  previewClassName="w-20 h-14 rounded-lg object-cover ring-1 ring-gray-200 bg-white"
                />
              </BrandingSubField>

              <BrandingSubField  error={logoError}>
                <AvatarUpload
                  value={logoUrl}
                  onChange={setLogoUrl}
                  onError={setLogoError}
                  selectedLabel={system.logoSelected}
                  removeLabel={system.logoRemove}
                  previewAlt="Logo hệ thống"
                  previewClassName="w-12 h-12 rounded-xl object-contain ring-1 ring-gray-200 bg-white p-1"
                />
              </BrandingSubField>
            </div>

    
          </SettingsSection>

          <SettingsSection
            title={`3. ${system.groupAttendanceLock}`}
            description={system.lockTimeHint}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <div>
                <label className={labelClass} htmlFor="attendance-lock-time">
                  {system.lockTime}
                </label>
                <input
                  id="attendance-lock-time"
                  type="time"
                  value={attendanceLockTime}
                  onChange={(e) => setAttendanceLockTime(e.target.value)}
                  className={timeInputClass}
                />
                <p className="text-xs text-content-muted mt-1.5">{system.lockTimeHint}</p>
              </div>
              <div>
                <label className={labelClass} htmlFor="attendance-reminder-time">
                  {system.reminderTime}
                </label>
                <input
                  id="attendance-reminder-time"
                  type="time"
                  value={attendanceReminderTime}
                  onChange={(e) => setAttendanceReminderTime(e.target.value)}
                  className={timeInputClass}
                />
                <p className="text-xs text-content-muted mt-1.5">{system.reminderTimeHint}</p>
              </div>
            </div>
          </SettingsSection>
        </div>

        <div className="flex justify-end bg-surface-white border border-gray-200 rounded-xl shadow-card px-5 py-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-5 rounded-lg btn-primary text-sm disabled:opacity-60"
          >
            {saving ? system.saving : ADMIN_UI.form.save}
          </button>
        </div>
      </div>
    </>
  );
}
