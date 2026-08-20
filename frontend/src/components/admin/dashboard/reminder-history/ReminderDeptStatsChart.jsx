import { memo, useMemo } from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ADMIN_UI } from '../../../../constants/admin';
import { COLORS } from '../../../../constants/theme';
import { getChartColor } from '../../../../utils/statusBreakdown';
import RefreshOverlay from '../../../shared/RefreshOverlay';

const TOP_N = 10;
const CHART_HEIGHT_PX = 220;
const OTHERS_KEY = '__others__';

function formatPercent(value, total) {
  if (total <= 0) return '0.0';
  return (Math.round((value / total) * 1000) / 10).toFixed(1);
}

function ChartTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-surface-white px-3 py-2 text-xs shadow-panel max-w-xs">
      <p className="font-semibold text-content-heading">{item.name}</p>
      <p className="text-content-muted mt-0.5 tabular-nums">
        {item.value} lần ({formatPercent(item.value, total)}%)
      </p>
    </div>
  );
}

/**
 * Donut stats by department — Top 10 + Others slice (SPEC_ADMIN §6.3 P-RemindChart).
 */
const ReminderDeptStatsChart = memo(function ReminderDeptStatsChart({
  stats,
  initialLoading,
  refreshing = false,
}) {
  const { dashboard: d } = ADMIN_UI;
  const safeStats = Array.isArray(stats) ? stats : [];

  const { pieSlices, legendItems, total, othersDeptCount } = useMemo(() => {
    const totalSent = safeStats.reduce((sum, row) => sum + (row.sentCount ?? 0), 0);
    const positive = safeStats
      .filter((row) => (row.sentCount ?? 0) > 0)
      .map((row) => ({
        deptCode: row.deptCode,
        deptName: row.deptName,
        sentCount: row.sentCount,
      }))
      .sort((a, b) => b.sentCount - a.sentCount || String(a.deptName).localeCompare(String(b.deptName), 'vi'));

    const top = positive.slice(0, TOP_N);
    const rest = positive.slice(TOP_N);
    const othersValue = rest.reduce((sum, row) => sum + row.sentCount, 0);

    const slices = top.map((row, index) => ({
      key: String(row.deptCode ?? row.deptName ?? index),
      name: row.deptName,
      value: row.sentCount,
      color: getChartColor(null, index),
      isOthers: false,
    }));

    if (othersValue > 0) {
      slices.push({
        key: OTHERS_KEY,
        name: d.reminderStatsOthers(rest.length),
        value: othersValue,
        color: COLORS.neutral.fg,
        isOthers: true,
      });
    }

    const legend = slices.map((slice) => ({
      key: slice.key,
      label: slice.name,
      value: slice.value,
      color: slice.color,
      percentLabel: formatPercent(slice.value, totalSent),
    }));

    return {
      pieSlices: slices,
      legendItems: legend,
      total: totalSent,
      othersDeptCount: rest.length,
    };
  }, [safeStats, d]);

  return (
    <section className="relative">
      {refreshing && <RefreshOverlay />}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3 mb-3 min-w-0">
        <h3 className="admin-section-title flex items-center gap-2 text-xs whitespace-nowrap min-w-0 shrink-0">
          <PieChartIcon className="w-4 h-4 shrink-0" aria-hidden />
          <span className="truncate">{d.reminderStatsTitle}</span>
        </h3>
        {total > 0 && (
          <span className="text-xs text-content-muted tabular-nums shrink-0 whitespace-nowrap">
            {d.reminderStatsTotalLabel}:{' '}
            <span className="font-semibold text-primary">{total}</span>
          </span>
        )}
      </div>

      {initialLoading && safeStats.length === 0 ? (
        <p className="text-sm text-content-muted py-6 text-center min-h-[120px]">{ADMIN_UI.loading}</p>
      ) : total === 0 ? (
        <p className="text-sm text-content-muted py-6 text-center min-h-[120px]">{d.reminderStatsEmpty}</p>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-stretch gap-4 min-h-[220px]">
          <div className="relative shrink-0 w-full sm:w-[220px] mx-auto sm:mx-0" style={{ height: CHART_HEIGHT_PX }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<ChartTooltip total={total} />} />
                <Pie
                  data={pieSlices}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={pieSlices.length > 1 ? 2 : 0}
                >
                  {pieSlices.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-primary tabular-nums">{total}</span>
              <span className="text-4xs font-semibold text-content-muted uppercase tracking-wide">
                {d.reminderStatsCenterLabel}
              </span>
            </div>
          </div>

          <ul className="flex-1 min-w-0 max-h-40 sm:max-h-[220px] overflow-y-auto overscroll-y-contain space-y-1.5 pr-1">
            {legendItems.map((item) => (
              <li key={item.key} className="flex items-center gap-2 text-xs min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                  aria-hidden
                />
                <span className="text-content-muted truncate min-w-0 flex-1" title={item.label}>
                  {item.label}
                </span>
                <span className="font-semibold text-content-heading tabular-nums shrink-0">
                  {item.value}
                </span>
                <span className="text-4xs text-content-muted tabular-nums shrink-0 w-10 text-right">
                  {item.percentLabel}%
                </span>
              </li>
            ))}
            {othersDeptCount > 0 ? (
              <li className="text-4xs text-content-muted pt-1 border-t border-line/60">
                {d.reminderStatsDetailHint}
              </li>
            ) : null}
          </ul>
        </div>
      )}
    </section>
  );
});

export default ReminderDeptStatsChart;
