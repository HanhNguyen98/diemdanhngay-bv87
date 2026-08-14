import { useCallback, useEffect, useState } from 'react';
import { ADMIN_UI } from '../constants/admin';
import { useAppBranding } from '../context/AppBrandingContext';
import { adminApi } from '../services/api';
import { useFlashMessage } from './useFlashMessage';

const DEFAULT_LOCK_TIME = '16:00';
const DEFAULT_REMINDER_TIME = '08:00';
const WORK_HOURS_DEFAULTS = {
  morningInOfficial: '07:00',
  noonOutOfficial: '11:00',
  afternoonInOfficial: '13:30',
  afternoonOutOfficial: '16:30',
  morningOpen: '05:00',
  midpoint1: '09:00',
  midpointNoon: '12:16',
  midpoint2: '15:00',
  dayClose: '21:00',
  lateGraceMinutes: 5,
  earlyGraceMinutes: 5,
};

export function useSystemSettings() {
  const { reloadBranding } = useAppBranding();
  const { flash, showSuccess, showError, clearFlash } = useFlashMessage();
  const [portalTitle, setPortalTitle] = useState(ADMIN_UI.portalTitle);
  const [logoUrl, setLogoUrl] = useState(null);
  const [loginAvatarUrl, setLoginAvatarUrl] = useState(null);
  const [attendanceLockTime, setAttendanceLockTime] = useState(DEFAULT_LOCK_TIME);
  const [attendanceReminderTime, setAttendanceReminderTime] = useState(DEFAULT_REMINDER_TIME);
  const [attendanceOpenTime, setAttendanceOpenTime] = useState('06:00');
  const [morningInOfficial, setMorningInOfficial] = useState('07:00');
  const [noonOutOfficial, setNoonOutOfficial] = useState('11:00');
  const [afternoonInOfficial, setAfternoonInOfficial] = useState('13:30');
  const [afternoonOutOfficial, setAfternoonOutOfficial] = useState('16:30');
  const [morningOpen, setMorningOpen] = useState('05:00');
  const [midpoint1, setMidpoint1] = useState('09:00');
  const [midpointNoon, setMidpointNoon] = useState('12:16');
  const [midpoint2, setMidpoint2] = useState('15:00');
  const [dayClose, setDayClose] = useState('21:00');
  const [lateGraceMinutes, setLateGraceMinutes] = useState(5);
  const [earlyGraceMinutes, setEarlyGraceMinutes] = useState(5);
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
        setMorningInOfficial(data.morningInOfficial || '07:00');
        setNoonOutOfficial(data.noonOutOfficial || '11:00');
        setAfternoonInOfficial(data.afternoonInOfficial || '13:30');
        setAfternoonOutOfficial(data.afternoonOutOfficial || '16:30');
        setMorningOpen(data.morningOpen || '05:00');
        setMidpoint1(data.midpoint1 || '09:00');
        setMidpointNoon(data.midpointNoon || '12:16');
        setMidpoint2(data.midpoint2 || '15:00');
        setDayClose(data.dayClose || '21:00');
        setLateGraceMinutes(data.lateGraceMinutes ?? 5);
        setEarlyGraceMinutes(data.earlyGraceMinutes ?? 5);
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
        morningInOfficial,
        noonOutOfficial,
        afternoonInOfficial,
        afternoonOutOfficial,
        morningOpen,
        midpoint1,
        midpointNoon,
        midpoint2,
        dayClose,
        lateGraceMinutes: Number(lateGraceMinutes),
        earlyGraceMinutes: Number(earlyGraceMinutes),
      });
      setAttendanceLockTime(data.attendanceLockTime || attendanceLockTime);
      setAttendanceReminderTime(data.attendanceReminderTime || attendanceReminderTime);
      setAttendanceOpenTime(data.attendanceOpenTime || attendanceOpenTime);
      setMorningInOfficial(data.morningInOfficial || morningInOfficial);
      setNoonOutOfficial(data.noonOutOfficial || noonOutOfficial);
      setAfternoonInOfficial(data.afternoonInOfficial || afternoonInOfficial);
      setAfternoonOutOfficial(data.afternoonOutOfficial || afternoonOutOfficial);
      setMorningOpen(data.morningOpen || morningOpen);
      setMidpoint1(data.midpoint1 || midpoint1);
      setMidpointNoon(data.midpointNoon || midpointNoon);
      setMidpoint2(data.midpoint2 || midpoint2);
      setDayClose(data.dayClose || dayClose);
      setLateGraceMinutes(data.lateGraceMinutes ?? lateGraceMinutes);
      setEarlyGraceMinutes(data.earlyGraceMinutes ?? earlyGraceMinutes);
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
    morningInOfficial,
    noonOutOfficial,
    afternoonInOfficial,
    afternoonOutOfficial,
    morningOpen,
    midpoint1,
    midpointNoon,
    midpoint2,
    dayClose,
    lateGraceMinutes,
    earlyGraceMinutes,
    loginAvatarError,
    loginAvatarUrl,
    logoError,
    logoUrl,
    portalTitle,
    reloadBranding,
    showError,
    showSuccess,
  ]);

  const resetWorkHours = useCallback(() => {
    setMorningInOfficial(WORK_HOURS_DEFAULTS.morningInOfficial);
    setNoonOutOfficial(WORK_HOURS_DEFAULTS.noonOutOfficial);
    setAfternoonInOfficial(WORK_HOURS_DEFAULTS.afternoonInOfficial);
    setAfternoonOutOfficial(WORK_HOURS_DEFAULTS.afternoonOutOfficial);
    setMorningOpen(WORK_HOURS_DEFAULTS.morningOpen);
    setMidpoint1(WORK_HOURS_DEFAULTS.midpoint1);
    setMidpointNoon(WORK_HOURS_DEFAULTS.midpointNoon);
    setMidpoint2(WORK_HOURS_DEFAULTS.midpoint2);
    setDayClose(WORK_HOURS_DEFAULTS.dayClose);
    setLateGraceMinutes(WORK_HOURS_DEFAULTS.lateGraceMinutes);
    setEarlyGraceMinutes(WORK_HOURS_DEFAULTS.earlyGraceMinutes);
  }, []);

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
    logoError,
    setLogoError,
    loginAvatarError,
    setLoginAvatarError,
    loading,
    saving,
    handleSave,
    resetWorkHours,
    flash,
    clearFlash,
  };
}
