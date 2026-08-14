import AvatarUpload from '../shared/AvatarUpload';
import AppLogo from '../shared/AppLogo';
import FlashBanner from '../shared/FlashBanner';
import LoginBrandingHeader from '../shared/LoginBrandingHeader';
import AdminSubmenuBreadcrumb from '../admin/sections/AdminSubmenuBreadcrumb';
import { ADMIN_UI } from '../../constants/admin';
import { useAppBranding } from '../../context/AppBrandingContext';
import { useSystemSettings } from '../../hooks/useSystemSettings';

const labelClass = 'block text-xs font-bold text-content-muted uppercase tracking-wide mb-1.5';
const section4LabelClass = `${labelClass} sm:whitespace-nowrap`;
const subLabelClass = 'block text-xs font-semibold text-gray-700 mb-1';
const inputClass =
  'w-full h-9 border border-gray-200 rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white';
const timeInputClass =
  'w-full min-w-0 max-w-full h-9 border border-line rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-surface-white';
const compactTimeInputClass =
  'w-44 max-w-full h-9 border border-line rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-surface-white';

function WorkHoursCard({ title, children }) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface-page/40 p-4 flex flex-col gap-3">
      <h3 className="text-xs font-bold uppercase tracking-wide text-navy">{title}</h3>
      {children}
    </div>
  );
}

function TimeField({ label, value, onChange, id }) {
  return (
    <div className="min-w-0">
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={timeInputClass}
      />
    </div>
  );
}

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
    morningInOfficial,
    setMorningInOfficial,
    noonOutOfficial,
    setNoonOutOfficial,
    afternoonInOfficial,
    setAfternoonInOfficial,
    afternoonOutOfficial,
    setAfternoonOutOfficial,
    morningOpen,
    setMorningOpen,
    midpoint1,
    setMidpoint1,
    midpointNoon,
    setMidpointNoon,
    midpoint2,
    setMidpoint2,
    dayClose,
    setDayClose,
    lateGraceMinutes,
    setLateGraceMinutes,
    earlyGraceMinutes,
    setEarlyGraceMinutes,
    resetWorkHours,
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

          <SettingsSection title={`3. ${system.groupWorkHours}`}>
            <p className="text-xs text-content-muted -mt-2">{system.workHoursHint}</p>

            <WorkHoursCard title={system.workHoursMilestoneTitle}>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 min-w-0">
                <TimeField id="wh-morning-in" label={system.morningInOfficial} value={morningInOfficial} onChange={setMorningInOfficial} />
                <TimeField id="wh-noon-out" label={system.noonOutOfficial} value={noonOutOfficial} onChange={setNoonOutOfficial} />
                <TimeField id="wh-afternoon-in" label={system.afternoonInOfficial} value={afternoonInOfficial} onChange={setAfternoonInOfficial} />
                <TimeField id="wh-afternoon-out" label={system.afternoonOutOfficial} value={afternoonOutOfficial} onChange={setAfternoonOutOfficial} />
              </div>
            </WorkHoursCard>

            <WorkHoursCard title={system.workHoursMidpointTitle}>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3 min-w-0">
                <TimeField id="wh-open" label={system.morningOpen} value={morningOpen} onChange={setMorningOpen} />
                <TimeField id="wh-mp1" label={system.midpoint1} value={midpoint1} onChange={setMidpoint1} />
                <TimeField id="wh-mp-noon" label={system.midpointNoon} value={midpointNoon} onChange={setMidpointNoon} />
                <TimeField id="wh-mp2" label={system.midpoint2} value={midpoint2} onChange={setMidpoint2} />
                <TimeField id="wh-close" label={system.dayClose} value={dayClose} onChange={setDayClose} />
              </div>
            </WorkHoursCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
              <WorkHoursCard title={system.windowPreview}>
                <ul className="text-sm text-content-muted space-y-1.5">
                  <li>{system.windowMorningIn}: <span className="tabular-nums font-semibold text-navy">{morningOpen} – {midpoint1}</span></li>
                  <li>{system.windowNoonOut}: <span className="tabular-nums font-semibold text-navy">{midpoint1} – {midpointNoon}</span></li>
                  <li>{system.windowAfternoonIn}: <span className="tabular-nums font-semibold text-navy">{midpointNoon} – {midpoint2}</span></li>
                  <li>{system.windowAfternoonOut}: <span className="tabular-nums font-semibold text-navy">{midpoint2} – {dayClose}</span></li>
                </ul>
              </WorkHoursCard>

              <WorkHoursCard title={system.workHoursGraceTitle}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                  <div className="min-w-0">
                    <label className={labelClass} htmlFor="wh-late-grace">{system.lateGraceMinutes}</label>
                    <input
                      id="wh-late-grace"
                      type="number"
                      min={0}
                      max={60}
                      value={lateGraceMinutes}
                      onChange={(e) => setLateGraceMinutes(e.target.value)}
                      className={timeInputClass}
                    />
                    <p className="text-xs text-content-muted mt-1.5">{system.lateGraceHint}</p>
                  </div>
                  <div className="min-w-0">
                    <label className={labelClass} htmlFor="wh-early-grace">{system.earlyGraceMinutes}</label>
                    <input
                      id="wh-early-grace"
                      type="number"
                      min={0}
                      max={60}
                      value={earlyGraceMinutes}
                      onChange={(e) => setEarlyGraceMinutes(e.target.value)}
                      className={timeInputClass}
                    />
                    <p className="text-xs text-content-muted mt-1.5">{system.earlyGraceHint}</p>
                  </div>
                </div>
              </WorkHoursCard>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetWorkHours}
                className="h-9 px-4 rounded-lg border border-line text-sm font-semibold text-navy bg-surface-white hover:bg-surface-page"
              >
                {system.resetWorkHours}
              </button>
            </div>
          </SettingsSection>

          <SettingsSection
            title={`4. ${system.groupAttendanceLock}`}
            description={system.lockTimeHint}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label className={section4LabelClass} htmlFor="attendance-lock-time">
                  {system.lockTime}
                </label>
                <input
                  id="attendance-lock-time"
                  type="time"
                  value={attendanceLockTime}
                  onChange={(e) => setAttendanceLockTime(e.target.value)}
                  className={compactTimeInputClass}
                />
                <p className="text-xs text-content-muted mt-1.5">{system.lockTimeHint}</p>
              </div>
              <div className="min-w-0">
                <label className={section4LabelClass} htmlFor="attendance-reminder-time">
                  {system.reminderTime}
                </label>
                <input
                  id="attendance-reminder-time"
                  type="time"
                  value={attendanceReminderTime}
                  onChange={(e) => setAttendanceReminderTime(e.target.value)}
                  className={compactTimeInputClass}
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
