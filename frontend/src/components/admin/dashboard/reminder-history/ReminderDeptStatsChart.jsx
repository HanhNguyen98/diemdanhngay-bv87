import { memo, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ADMIN_UI } from '../../../../constants/admin';
import { FONT_FAMILY_SANS } from '../../../../constants/theme';
import RefreshOverlay from '../../../shared/RefreshOverlay';

const BAR_ROW_HEIGHT = 32;
const CHART_MAX_HEIGHT = 280;
const Y_AXIS_WIDTH = 220;
const BAR_COLOR = '#2563EB';
const APP_FONT = FONT_FAMILY_SANS;

function YAxisDeptTick({ x, y, payload }) {
  const name = payload?.value ?? '';
  const labelWidth = Y_AXIS_WIDTH - 12;
  return (
    <foreignObject x={x - labelWidth + 4} y={y - 12} width={labelWidth} height={24}>
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        className="text-2xs text-content-muted truncate text-right leading-6 pr-2"
        style={{ fontFamily: APP_FONT }}
        title={name}
      >
        {name}
      </div>
    </foreignObject>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-panel">
      <p className="font-semibold text-content-heading">{item.deptName}</p>
      <p className="text-content-muted mt-0.5 tabular-nums">
        {item.sentCount} lần ({item.percentLabel}%)
      </p>
    </div>
  );
}

const ReminderDeptStatsChart = memo(function ReminderDeptStatsChart({
  stats,
  initialLoading,
  refreshing = false,
}) {
  const { dashboard: d } = ADMIN_UI;
  const safeStats = Array.isArray(stats) ? stats : [];

  const { chartRows, total } = useMemo(() => {
    const totalSent = safeStats.reduce((sum, row) => sum + row.sentCount, 0);
    const rows = safeStats
      .filter((row) => row.sentCount > 0)
      .map((row) => {
        const percent = totalSent > 0 ? (row.sentCount / totalSent) * 100 : 0;
        const percentLabel =
          totalSent > 0 ? (Math.round(percent * 10) / 10).toFixed(1) : '0.0';
        return { ...row, percentLabel };
      });
    return { chartRows: rows, total: totalSent };
  }, [safeStats]);

  const chartHeight = Math.max(chartRows.length * BAR_ROW_HEIGHT, BAR_ROW_HEIGHT * 2);

  return (
    <section className="relative">
      {refreshing && <RefreshOverlay />}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="admin-section-title flex items-center gap-2 text-xs">
          <BarChart3 className="w-4 h-4" />
          {d.reminderStatsTitle}
        </h3>
        {total > 0 && (
          <span className="text-xs text-content-muted tabular-nums shrink-0">
            {d.reminderStatsTotalLabel}:{' '}
            <span className="font-semibold text-primary">{total}</span>
          </span>
        )}
      </div>

      {initialLoading && safeStats.length === 0 ? (
        <p className="text-sm text-content-muted py-6 text-center min-h-[120px]">Đang tải...</p>
      ) : total === 0 ? (
        <p className="text-sm text-content-muted py-6 text-center min-h-[120px]">{d.reminderStatsEmpty}</p>
      ) : (
        <div
          className="overflow-y-auto overscroll-y-contain min-h-[120px]"
          style={{ maxHeight: CHART_MAX_HEIGHT }}
        >
          <div style={{ height: chartHeight, minWidth: '100%' }}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                layout="vertical"
                data={chartRows}
                margin={{ top: 4, right: 44, left: 0, bottom: 4 }}
                barCategoryGap="20%"
              >
                <CartesianGrid horizontal={false} stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis
                  type="category"
                  dataKey="deptName"
                  width={Y_AXIS_WIDTH}
                  Interval={0}
                  tick={<YAxisDeptTick />}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="sentCount" fill={BAR_COLOR} radius={[0, 4, 4, 0]} maxBarSize={18}>
                  <LabelList
                    dataKey="sentCount"
                    position="right"
                    style={{ fontSize: 11, fill: '#374151', fontFamily: APP_FONT }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
});

export default ReminderDeptStatsChart;
