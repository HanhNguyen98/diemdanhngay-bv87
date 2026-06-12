import { memo, useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { ADMIN_UI } from '../../../constants/admin';
import { STATISTICS_CHART_COLORS, UI } from '../../../constants/attendance';

const SLICES = [
  { key: 'diLam', label: UI.kpiPresent, color: STATISTICS_CHART_COLORS.diLam },
  { key: 'nghiPhep', label: UI.kpiAbsent, color: STATISTICS_CHART_COLORS.nghiPhep },
  { key: 'diHoc', label: UI.kpiStudy, color: STATISTICS_CHART_COLORS.diHoc },
  { key: 'diCongTac', label: UI.kpiDuty, color: STATISTICS_CHART_COLORS.diCongTac },
  { key: 'unchecked', label: ADMIN_UI.dashboard.chartUnchecked, color: '#D1D5DB' },
];

const PresenceDonutChart = memo(function PresenceDonutChart({ kpi }) {
  const data = useMemo(
    () =>
      SLICES.map((s) => ({
        name: s.label,
        value: s.key === 'unchecked' ? kpi?.unchecked ?? 0 : kpi?.[s.key] ?? 0,
        color: s.color,
      })).filter((d) => d.value > 0),
    [kpi],
  );

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  const marked = total - (kpi?.unchecked ?? 0);
  const percent = total > 0 ? Math.round((marked / total) * 1000) / 10 : 0;

  return (
    <section className="bg-surface-white border border-gray-200 rounded-xl shadow-card p-4 h-full flex flex-col">
      <h3 className="text-sm font-bold text-gray-800 mb-3">{ADMIN_UI.dashboard.presenceTitle}</h3>
      <div className="flex-1 min-h-[220px] relative">
        {total === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-content-muted">Chưa có dữ liệu</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={2}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-primary">{percent}%</span>
              <span className="text-2xs text-content-muted uppercase">đã chấm</span>
            </div>
          </>
        )}
      </div>
      <ul className="mt-3 space-y-1.5">
        {SLICES.map((s) => {
          const val = s.key === 'unchecked' ? kpi?.unchecked ?? 0 : kpi?.[s.key] ?? 0;
          return (
            <li key={s.key} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-content-muted">{s.label}</span>
              <span className="font-semibold text-gray-800 tabular-nums">{val}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
});

export default PresenceDonutChart;
