import { memo, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ADMIN_UI } from '../../../../constants/admin';

const DEPT_SLICE_COLORS = [
  '#2563EB',
  '#F59E0B',
  '#10B981',
  '#EF4444',
  '#8B5CF6',
  '#14B8A6',
  '#EC4899',
];

const ZERO_COLOR = '#E5E7EB';

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: item } = payload[0];
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-panel">
      <p className="font-semibold text-gray-800">{name}</p>
      <p className="text-content-muted mt-0.5 tabular-nums">
        {value} lần ({item.percentLabel}%)
      </p>
    </div>
  );
}

const ReminderDeptStatsChart = memo(function ReminderDeptStatsChart({ stats, loading }) {
  const { dashboard: d } = ADMIN_UI;

  const { chartRows, chartData, total } = useMemo(() => {
    const totalSent = stats.reduce((sum, row) => sum + row.sentCount, 0);
    let colorIdx = 0;

    const rows = stats.map((row) => {
      const hasValue = row.sentCount > 0;
      const color = hasValue
        ? DEPT_SLICE_COLORS[colorIdx++ % DEPT_SLICE_COLORS.length]
        : ZERO_COLOR;
      const percent = totalSent > 0 ? (row.sentCount / totalSent) * 100 : 0;
      const percentLabel = totalSent > 0 ? (Math.round(percent * 10) / 10).toFixed(1) : '0.0';
      return { ...row, color, percent, percentLabel };
    });

    const slices = rows
      .filter((row) => row.sentCount > 0)
      .map((row) => ({
        name: row.deptName,
        value: row.sentCount,
        color: row.color,
        percentLabel: row.percentLabel,
      }));

    return { chartRows: rows, chartData: slices, total: totalSent };
  }, [stats]);

  return (
    <section>
      <h3 className="flex items-center gap-2 text-xs font-bold text-primary uppercase mb-4">
        <BarChart3 className="w-4 h-4" />
        {d.reminderStatsTitle}
      </h3>

      {loading && stats.length === 0 ? (
        <p className="text-sm text-content-muted py-6 text-center">Đang tải...</p>
      ) : stats.length === 0 ? (
        <p className="text-sm text-content-muted py-6 text-center">{d.reminderStatsEmpty}</p>
      ) : total === 0 ? (
        <p className="text-sm text-content-muted py-6 text-center">{d.reminderStatsEmpty}</p>
      ) : (
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="relative w-full lg:w-[280px] shrink-0 h-[240px] mx-auto lg:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="52%"
                  outerRadius="78%"
                  paddingAngle={2}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-primary tabular-nums">{total}</span>
              <span className="text-2xs text-content-muted uppercase tracking-wide">
                {d.reminderStatsTotalLabel}
              </span>
            </div>
          </div>

          <ul className="flex-1 min-w-0 space-y-2">
            {chartRows.map((row) => (
              <li
                key={row.deptCode}
                className="flex items-center gap-2 text-sm py-1 border-b border-gray-50 last:border-0"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: row.color }}
                />
                <span className="flex-1 min-w-0 text-gray-800 truncate" title={row.deptName}>
                  {row.deptName}
                </span>
                <span className="shrink-0 tabular-nums text-gray-800 font-semibold">
                  {row.sentCount}
                </span>
                <span className="shrink-0 w-14 text-right tabular-nums text-content-muted text-xs">
                  {row.percentLabel}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
});

export default ReminderDeptStatsChart;
