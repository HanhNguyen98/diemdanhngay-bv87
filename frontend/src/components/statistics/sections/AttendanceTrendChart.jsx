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
import { STATISTICS_UI } from '../../../constants/attendance';
import {
  breakdownToChartSeries,
  trendHasData,
  trendToChartData,
} from '../../../utils/statusBreakdown';
import { useAttendanceStatusConfig } from '../../../context/AttendanceStatusContext';
import { useIsMobile } from '../../../hooks/useIsMobile';

function ChartLegendPill({ series, compact = false }) {
  if (!series?.length) return null;
  return (
    <div
      className={`w-full overflow-x-auto scrollbar-none rounded-full border border-gray-200 bg-table-header ${
        compact ? 'px-3 py-2' : 'px-4 py-1.5'
      }`}
      aria-label="Chú thích biểu đồ"
    >
      <div className="flex items-center justify-center gap-3 lg:gap-4 flex-nowrap min-w-max">
        {series.map((item) => (
          <div key={item.key} className="flex items-center gap-2 shrink-0">
            <span
              className="h-[3px] w-5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            <span className="text-3xs font-semibold text-content-heading uppercase tracking-wide leading-none whitespace-nowrap">
              {item.label}
            </span>
          </div>
        ))}
      </div>
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
  const { items: catalogItems } = useAttendanceStatusConfig();
  const isMobile = useIsMobile();

  const series = useMemo(
    () => breakdownToChartSeries(catalogItems.length ? catalogItems : mergeTrendCatalog(trend)),
    [catalogItems, trend],
  );

  const chartData = useMemo(() => trendToChartData(trend), [trend]);
  const hasData = trendHasData(chartData, series);
  const chartHeight = isMobile ? 220 : 260;
  const legendBlockHeight = isMobile ? 44 : 36;
  const plotBlockMinHeight = chartHeight + legendBlockHeight + 16;
  const tickFontSize = isMobile ? 12 : 15;
  const marginRight = isMobile ? 8 : 16;
  const strokeWidth = isMobile ? 2 : 2.5;
  const dotR = isMobile ? 3 : 4;
  const activeDotR = isMobile ? 5 : 6;

  return (
    <section className="shrink-0 bg-surface-white border border-line rounded-xl shadow-card p-4 lg:p-5">
      <div className={`mb-4 ${isMobile ? 'space-y-3' : 'space-y-2'}`}>
        <h2 className="text-4xs leading-tight whitespace-nowrap lg:text-sm lg:leading-normal lg:whitespace-normal font-semibold text-content-heading">
          {STATISTICS_UI.chartTitle}
        </h2>
      </div>

      <div className="w-full min-h-0" style={{ minHeight: plotBlockMinHeight }}>
        {!hasData ? (
          <div
            className="flex items-center justify-center text-content-muted text-sm"
            style={{ height: chartHeight }}
          >
            {STATISTICS_UI.noData}
          </div>
        ) : (
          <div className="w-full min-h-0" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: marginRight, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: tickFontSize, fill: '#6C757D' }}
                  axisLine={{ stroke: '#E0E0E0' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: tickFontSize, fill: '#6C757D' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                {series.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={strokeWidth}
                    dot={{ r: dotR, fill: s.color, strokeWidth: 0 }}
                    activeDot={{ r: activeDotR }}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-3 flex justify-center min-h-[2.25rem]">
          <div className="max-w-full">
            {hasData ? <ChartLegendPill series={series} compact={isMobile} /> : null}
          </div>
        </div>
      </div>
    </section>
  );
});

function mergeTrendCatalog(trend) {
  const map = new Map();
  (trend ?? []).forEach((point) => {
    (point.statusBreakdown ?? []).forEach((item) => {
      if (!map.has(item.code)) map.set(item.code, item);
    });
  });
  return [...map.values()];
}

export default AttendanceTrendChart;
