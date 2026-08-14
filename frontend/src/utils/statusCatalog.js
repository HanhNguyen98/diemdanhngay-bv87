import {
  ATTENDANCE_STATUS,
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
  indigo: 'badge-info',
  cyan: 'badge-info',
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

  const activeItems = [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const statusOptions = activeItems
    .filter((item) => !item.groupParent)
    .map((item) => ({
      value: item.code,
      label: item.label,
    }));

  const childOptionsByParent = activeItems.reduce((acc, item) => {
    if (!item.parentCode) {
      return acc;
    }
    const next = acc[item.parentCode] || [];
    next.push({
      value: item.code,
      label: item.label,
      badgeLabel: item.badgeLabel,
      color: item.colorKey,
      icon: item.iconKey,
    });
    acc[item.parentCode] = next;
    return acc;
  }, {});

  const quickActions = activeItems
    .filter(
      (item) =>
        item.manualAllowed &&
        !FINGERPRINT_ONLY_STATUSES.has(item.code) &&
        !item.parentCode &&
        item.code !== ATTENDANCE_STATUS.VE_SOM,
    )
    .map((item) => ({
      value: item.code,
      color: item.colorKey,
      icon: item.iconKey,
      label: item.label,
      statusOptions: childOptionsByParent[item.code] || [],
      groupParent: Boolean(item.groupParent),
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
