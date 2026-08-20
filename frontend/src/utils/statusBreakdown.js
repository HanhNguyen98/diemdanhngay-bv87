import { isAttendanceUnchecked } from '../constants/attendance';
import { STATUS_KPI_ICON_MAP as KPI_ICON_MAP } from './statusIcons.jsx';

/** Default metric card surface (P3d). */
export const KPI_METRIC_CARD_SURFACE = 'bg-surface-white border-line';
/** “Tổng…” summary card surface (P3e). */
export const KPI_TOTAL_CARD_SURFACE = 'bg-info-surface border-info-line';
export const KPI_METRIC_CARD_BASE = 'border rounded-xl shadow-card';
export const KPI_METRIC_CARD_SHELL = `${KPI_METRIC_CARD_SURFACE} ${KPI_METRIC_CARD_BASE}`;
export const KPI_TOTAL_CARD_SHELL = `${KPI_TOTAL_CARD_SURFACE} ${KPI_METRIC_CARD_BASE}`;

export const KPI_TILE_ICON_BG = {
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  yellow: 'bg-amber-500',
  blue: 'bg-blue-600',
  teal: 'bg-teal-500',
  purple: 'bg-violet-500',
  amber: 'bg-orange-500',
  indigo: 'bg-indigo-500',
  cyan: 'bg-cyan-500',
};

export const KPI_BG_BY_COLOR = {
  green: 'bg-kpi-present',
  red: 'bg-kpi-absent',
  yellow: 'bg-kpi-duty',
  blue: 'bg-info',
  teal: 'bg-info',
  purple: 'bg-violet-50',
  amber: 'bg-kpi-duty',
  indigo: 'bg-info',
  cyan: 'bg-info',
};

export const KPI_LABEL_CLASS_BY_COLOR = {
  green: 'text-success-dark',
  red: 'text-danger-dark',
  yellow: 'text-warning-dark',
  blue: 'text-primary',
  teal: 'text-primary',
  purple: 'text-violet-700',
  amber: 'text-warning-dark',
  indigo: 'text-primary',
  cyan: 'text-primary',
};

/** Status KPI card label — bold black uppercase, safe for Vietnamese diacritics. */
export const KPI_STATUS_LABEL_CLASS =
  'font-bold uppercase text-black line-clamp-2 break-words';

/** Desktop / fluid tile label size + P3c weight/color. */
export const KPI_STATUS_LABEL_CLASS_DEFAULT =
  `mt-1 text-3xs leading-snug tracking-wide ${KPI_STATUS_LABEL_CLASS}`;

/** Peek / dense mobile tile label size + P3c weight/color. */
export const KPI_STATUS_LABEL_CLASS_PEEK =
  `mt-1 text-[0.8rem] leading-snug tracking-tight ${KPI_STATUS_LABEL_CLASS}`;

/** HEAD Chấm công desktop compact tile (P6-HeadKpiCompact). */
export const KPI_STATUS_LABEL_CLASS_COMPACT_DESKTOP =
  `mt-0.5 text-4xs leading-snug tracking-tight ${KPI_STATUS_LABEL_CLASS} line-clamp-1 whitespace-nowrap`;

/** Admin/Statistics KpiMetricCard status label. */
export const KPI_STATUS_LABEL_CLASS_METRIC =
  `mt-1 text-2xs leading-snug tracking-wider ${KPI_STATUS_LABEL_CLASS} max-w-full`;

export const KPI_STATUS_LABEL_CLASS_METRIC_COMPACT =
  `mt-1 text-3xs leading-snug tracking-wide ${KPI_STATUS_LABEL_CLASS} max-w-full`;

/** Mobile 2-col stat pair under total card (P3f) — single line, full card width, no clip. */
export const KPI_STAT_LABEL_CLASS_MOBILE_PAIR =
  'text-4xs leading-snug tracking-tight font-bold uppercase text-black whitespace-nowrap w-full min-w-0';

export const CHART_COLOR_BY_COLOR_KEY = {
  green: '#2563EB',
  red: '#14B8A6',
  yellow: '#F59E0B',
  blue: '#047857',
  teal: '#0D9488',
  purple: '#7C3AED',
  amber: '#EA580C',
  indigo: '#4F46E5',
  cyan: '#0891B2',
};

export function getChartColor(colorKey, index = 0) {
  if (colorKey && CHART_COLOR_BY_COLOR_KEY[colorKey]) {
    return CHART_COLOR_BY_COLOR_KEY[colorKey];
  }
  const fallback = ['#2563EB', '#14B8A6', '#F59E0B', '#047857', '#7C3AED', '#EA580C'];
  return fallback[index % fallback.length];
}

export function countFromBreakdown(breakdown, code) {
  const item = (breakdown ?? []).find((entry) => entry.code === code);
  return item?.count ?? 0;
}

export function normalizeStatusBreakdown(breakdown) {
  if (!Array.isArray(breakdown)) return [];
  return [...breakdown]
    .map((item) => ({
      ...item,
      children: Array.isArray(item.children)
        ? [...item.children].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        : [],
    }))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function buildGroupedItems(catalogItems, counts) {
  const activeItems = [...(catalogItems || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const itemByCode = new Map(activeItems.map((item) => [item.code, item]));
  const output = [];

  for (const item of activeItems) {
    if (item.parentCode && itemByCode.has(item.parentCode)) {
      continue;
    }
    if (item.groupParent) {
      const children = activeItems
        .filter((child) => child.parentCode === item.code)
        .map((child) => ({
          code: child.code,
          label: child.label,
          badgeLabel: child.badgeLabel,
          colorKey: child.colorKey,
          iconKey: child.iconKey,
          sortOrder: child.sortOrder ?? 0,
          count: counts[child.code] ?? 0,
          children: [],
        }));
      output.push({
        code: item.code,
        label: item.label,
        badgeLabel: item.badgeLabel,
        colorKey: item.colorKey,
        iconKey: item.iconKey,
        sortOrder: item.sortOrder ?? 0,
        count: children.reduce((sum, child) => sum + (child.count ?? 0), 0),
        children,
      });
      continue;
    }
    output.push({
      code: item.code,
      label: item.label,
      badgeLabel: item.badgeLabel,
      colorKey: item.colorKey,
      iconKey: item.iconKey,
      sortOrder: item.sortOrder ?? 0,
      count: counts[item.code] ?? 0,
      children: [],
    });
  }

  return output.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

/**
 * Rebuild KPI breakdown from current staff rows (keeps catalog order/labels).
 * @param {Array} staffList
 * @param {Array} catalogItems - active status types from API
 */
export function buildBreakdownFromStaff(staffList, catalogItems) {
  if (!catalogItems?.length) return [];

  const counts = {};
  for (const staff of staffList ?? []) {
    if (!isAttendanceUnchecked(staff) && staff.status) {
      counts[staff.status] = (counts[staff.status] || 0) + 1;
    }
  }

  return buildGroupedItems(catalogItems, counts);
}

export function mergeBreakdownWithCatalog(breakdown, catalogItems) {
  if (!catalogItems?.length) {
    return normalizeStatusBreakdown(breakdown);
  }

  // P6-KpiFlatten — flatten nested children (same as BE mergeBreakdowns)
  const counts = {};
  for (const item of breakdown ?? []) {
    if (!item?.code) continue;
    if (item.children?.length) {
      for (const child of item.children) {
        if (child?.code) {
          counts[child.code] = (counts[child.code] || 0) + (child.count ?? 0);
        }
      }
    } else {
      counts[item.code] = (counts[item.code] || 0) + (item.count ?? 0);
    }
  }

  return buildGroupedItems(catalogItems, counts);
}

export function breakdownToChartSeries(breakdown) {
  return normalizeStatusBreakdown(breakdown).map((item, index) => ({
    key: item.code,
    label: item.label,
    color: getChartColor(item.colorKey, index),
  }));
}

export function trendToChartData(trend) {
  return (trend ?? []).map((point) => {
    const row = { label: point.label };
    normalizeStatusBreakdown(point.statusBreakdown).forEach((item) => {
      row[item.code] = item.count ?? 0;
    });
    return row;
  });
}

export function trendHasData(chartData, series) {
  if (!chartData?.length || !series?.length) return false;
  return chartData.some((row) => series.some((s) => row[s.key] > 0));
}
