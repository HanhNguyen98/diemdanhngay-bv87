import { memo, useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { ADMIN_UI } from '../../../constants/admin';
import { getChartColor, normalizeStatusBreakdown } from '../../../utils/statusBreakdown';

const PresenceDonutChart = memo(function PresenceDonutChart({ kpi, scopeLabel, compact = false }) {
  const breakdown = normalizeStatusBreakdown(kpi?.statusBreakdown);

  const data = useMemo(() => {
    const slices = breakdown
      .filter((item) => (item.count ?? 0) > 0)
      .map((item, index) => ({
        name: item.label,
        value: item.count,
        color: getChartColor(item.colorKey, index),
      }));
    const unchecked = kpi?.unchecked ?? 0;
    if (unchecked > 0) {
      slices.push({
        name: ADMIN_UI.dashboard.chartUnchecked,
        value: unchecked,
        color: '#D1D5DB',
      });
    }
    return slices;
  }, [breakdown, kpi?.unchecked]);

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  const marked = total - (kpi?.unchecked ?? 0);
  const percent = total > 0 ? Math.round((marked / total) * 1000) / 10 : 0;

  const legendItems = useMemo(
    () => [
      ...breakdown.map((item, index) => ({
        key: item.code,
        label: item.label,
        value: item.count ?? 0,
        color: getChartColor(item.colorKey, index),
      })),
      {
        key: 'unchecked',
        label: ADMIN_UI.dashboard.chartUnchecked,
        value: kpi?.unchecked ?? 0,
        color: '#D1D5DB',
      },
    ],
    [breakdown, kpi?.unchecked],
  );

  return (
    <section
      className={`bg-surface-white border border-line rounded-xl shadow-card min-h-0 min-w-0 max-w-full ${compact ? 'lg:hidden p-3' : 'p-4 h-full flex flex-col flex-1'
        }`}
    >
      <h3 className="admin-section-title">
        {ADMIN_UI.dashboard.presenceTitle}
      </h3>
      {scopeLabel && (
        <p
          className={`text-content-muted truncate ${compact ? 'text-2xs mt-0' : 'text-xs mt-0 leading-snug'}`}
          title={scopeLabel}
        >
          {scopeLabel}
        </p>
      )}
      <div className={`relative shrink-0 ${compact ? 'h-[140px]' : 'flex-1 min-h-[220px]'}`}>
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
              <span className={`font-bold text-primary ${compact ? 'text-lg' : 'text-2xl'}`}>{percent}%</span>
              <span className="text-4xs font-semibold text-content-muted uppercase">đã chấm</span>
            </div>
          </>
        )}
      </div>
      <ul
        className={`shrink-0 overflow-y-auto ${compact ? 'mt-1.5 max-h-[5.5rem] space-y-1' : 'mt-3 max-h-40 space-y-1.5'
          }`}
      >
        {legendItems.map((s) => (
          <li
            key={s.key}
            className={`flex items-center ${compact ? 'gap-1.5 text-4xs' : 'gap-2 text-xs'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className={compact ? 'text-content-muted' : 'text-content-muted truncate min-w-0 flex-1'}>
              {s.label}
            </span>
            <span
              className={`font-semibold text-content-heading tabular-nums shrink-0 ${compact ? '' : 'ml-auto'
                }`}
            >
              {s.value}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
});

export default PresenceDonutChart;
