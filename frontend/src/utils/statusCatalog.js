import {
  ATTENDANCE_STATUS,
  MANUAL_ATTENDANCE_STATUSES,
  QUICK_ACTIONS as DEFAULT_QUICK_ACTIONS,
  STATUS_BADGE as DEFAULT_STATUS_BADGE,
  STATUS_OPTIONS as DEFAULT_STATUS_OPTIONS,
} from '../constants/attendance';

const COLOR_BADGE_CLASS = {
  green: 'badge-status-present',
  red: 'badge-status-absent',
  yellow: 'badge-status-study',
  blue: 'badge-status-trip',
  teal: 'badge-status-teal',
  purple: 'badge-status-purple',
  amber: 'badge-status-duty',
};

const FINGERPRINT_ONLY_STATUSES = new Set([
  ATTENDANCE_STATUS.DI_LAM,
  ATTENDANCE_STATUS.DI_TRE,
]);

export function buildStatusConfig(items) {
  if (!items?.length) {
    return {
      statusOptions: DEFAULT_STATUS_OPTIONS,
      quickActions: DEFAULT_QUICK_ACTIONS,
      statusBadge: DEFAULT_STATUS_BADGE,
    };
  }

  const statusOptions = items.map((item) => ({
    value: item.code,
    label: item.label,
  }));

  // SPEC: HEAD quick-actions = manual whitelist only (no DI_LAM / DI_TRE)
  const manualSet = new Set(MANUAL_ATTENDANCE_STATUSES);
  const quickActions = items
    .filter((item) => manualSet.has(item.code) && !FINGERPRINT_ONLY_STATUSES.has(item.code))
    .map((item) => ({
      value: item.code,
      color: item.colorKey,
      icon: item.iconKey,
    }));

  const statusBadge = items.reduce((acc, item) => {
    acc[item.code] = {
      label: item.badgeLabel,
      className: COLOR_BADGE_CLASS[item.colorKey] || 'badge-neutral',
      icon: item.iconKey,
    };
    return acc;
  }, {});

  return {
    statusOptions,
    quickActions: quickActions.length ? quickActions : DEFAULT_QUICK_ACTIONS,
    statusBadge: { ...DEFAULT_STATUS_BADGE, ...statusBadge },
  };
}

export function getDefaultStatusConfig() {
  return buildStatusConfig(null);
}
