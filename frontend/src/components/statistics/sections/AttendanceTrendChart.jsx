import { memo, useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  STATISTICS_CHART_COLORS,
  STATISTICS_UI,
  UI,
} from '../../../constants/attendance';

const SERIES = [
  { key: 'diLam', label: UI.kpiPresent, color: STATISTICS_CHART_COLORS.diLam },
  { key: 'nghiPhep', label: UI.kpiAbsent, color: STATISTICS_CHART_COLORS.nghiPhep },
  { key: 'diHoc', label: UI.kpiStudy, color: STATISTICS_CHART_COLORS.diHoc },
  { key: 'diCongTac', label: UI.kpiDuty, color: STATISTICS_CHART_COLORS.diCongTac },
];

function ChartLegendPill() {
  return (
    <div
      className="inline-flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-full border border-gray-200 bg-table-header px-5 py-2"
      aria-label="Chú thích biểu đồ"
    >
      {SERIES.map((item) => (
        <div key={item.key} className="flex items-center gap-2">
          <span
            className="h-[3px] w-5 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          <span className="text-3xs font-semibold text-content-heading uppercase tracking-wide leading-none">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-white border border-line rounded-lg shadow-card px-3 py-2 text-xs">
      <p className="font-semibold text-content-heading mb-1.5">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="tabular-nums">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

const AttendanceTrendChart = memo(function AttendanceTrendChart({ trend }) {
  const chartData = useMemo(
    () =>
      (trend ?? []).map((point) => ({
        label: point.label,
        diLam: point.diLam ?? 0,
        nghiPhep: point.nghiPhep ?? 0,
        diHoc: point.diHoc ?? 0,
        diCongTac: point.diCongTac ?? 0,
      })),
    [trend],
  );

  const hasData = chartData.some(
    (row) => row.diLam || row.nghiPhep || row.diHoc || row.diCongTac,
  );

  return (
    <section className="hidden lg:block shrink-0 bg-surface-white border border-line rounded-xl shadow-card p-4 lg:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-sm font-semibold text-content-heading">
          {STATISTICS_UI.chartTitle}
        </h2>
        {hasData && <ChartLegendPill />}
      </div>

      {!hasData ? (
        <p className="text-center text-content-muted py-16 text-sm">{STATISTICS_UI.noData}</p>
      ) : (
        <div className="h-[260px] w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 15, fill: '#6C757D' }}
                axisLine={{ stroke: '#E0E0E0' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 15, fill: '#6C757D' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              {SERIES.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: s.color, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
});

export default AttendanceTrendChart;
