import { useCallback, useEffect, useState } from 'react';
import { ADMIN_UI } from '../constants/admin';
import { useAppBranding } from '../context/AppBrandingContext';
import { adminApi } from '../services/api';
import { useFlashMessage } from './useFlashMessage';

const DEFAULT_LOCK_TIME = '16:00';
const DEFAULT_REMINDER_TIME = '08:00';

export function useSystemSettings() {
  const { reloadBranding } = useAppBranding();
  const { flash, showSuccess, showError, clearFlash } = useFlashMessage();
  const [portalTitle, setPortalTitle] = useState(ADMIN_UI.portalTitle);
  const [logoUrl, setLogoUrl] = useState(null);
  const [loginAvatarUrl, setLoginAvatarUrl] = useState(null);
  const [attendanceLockTime, setAttendanceLockTime] = useState(DEFAULT_LOCK_TIME);
  const [attendanceReminderTime, setAttendanceReminderTime] = useState(DEFAULT_REMINDER_TIME);
  const [attendanceOpenTime, setAttendanceOpenTime] = useState('06:00');
  const [logoError, setLogoError] = useState('');
  const [loginAvatarError, setLoginAvatarError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi
      .getBranding()
      .then((data) => {
        if (cancelled) return;
        setPortalTitle(data.portalTitle || ADMIN_UI.portalTitle);
        setLogoUrl(data.logoUrl || null);
        setLoginAvatarUrl(data.loginAvatarUrl || null);
        setAttendanceLockTime(data.attendanceLockTime || DEFAULT_LOCK_TIME);
        setAttendanceReminderTime(data.attendanceReminderTime || DEFAULT_REMINDER_TIME);
        setAttendanceOpenTime(data.attendanceOpenTime || '06:00');
      })
      .catch((err) => {
        if (!cancelled) showError(err.message || ADMIN_UI.flash.saveFail);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showError]);

  const handleSave = useCallback(async () => {
    if (logoError || loginAvatarError) {
      showError(logoError || loginAvatarError);
      return;
    }
    if (!portalTitle.trim()) {
      showError(ADMIN_UI.settings.system.titleRequired);
      return;
    }
    if (!attendanceLockTime) {
      showError(ADMIN_UI.settings.system.lockTimeRequired);
      return;
    }
    if (!attendanceReminderTime) {
      showError(ADMIN_UI.settings.system.reminderTimeRequired);
      return;
    }
    setSaving(true);
    try {
      const data = await adminApi.updateBranding({
        portalTitle: portalTitle.trim(),
        logoUrl,
        loginAvatarUrl,
        attendanceLockTime,
        attendanceReminderTime,
      });
      setAttendanceLockTime(data.attendanceLockTime || attendanceLockTime);
      setAttendanceReminderTime(data.attendanceReminderTime || attendanceReminderTime);
      setAttendanceOpenTime(data.attendanceOpenTime || attendanceOpenTime);
      await reloadBranding();
      showSuccess(ADMIN_UI.flash.settingsSaveSuccess);
    } catch (err) {
      showError(err.message || ADMIN_UI.flash.saveFail);
    } finally {
      setSaving(false);
    }
  }, [
    attendanceLockTime,
    attendanceReminderTime,
    attendanceOpenTime,
    loginAvatarError,
    loginAvatarUrl,
    logoError,
    logoUrl,
    portalTitle,
    reloadBranding,
    showError,
    showSuccess,
  ]);

  return {
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
    logoError,
    setLogoError,
    loginAvatarError,
    setLoginAvatarError,
    loading,
    saving,
    handleSave,
    flash,
    clearFlash,
  };
}
