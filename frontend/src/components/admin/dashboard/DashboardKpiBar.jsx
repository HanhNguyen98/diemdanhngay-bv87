import { memo, useMemo } from 'react';
import { Users } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';
import { KPI_METRIC_ICON_BOX, KPI_METRIC_ICON_SIZE } from '../../../constants/attendance';
import { useAttendanceStatusConfig } from '../../../context/AttendanceStatusContext';
import { KPI_BG_BY_COLOR, mergeBreakdownWithCatalog } from '../../../utils/statusBreakdown';
import { StatusBreakdownIcon } from '../../shared/StatusBreakdownIcon';
import { KpiMetricCard } from '../../shared/StatusBreakdownKpiGrid';
import DashboardMobileKpiBar from './DashboardMobileKpiBar';

const CARD =
  'bg-surface-white border border-line rounded-xl px-3 py-2.5 shadow-card flex items-center gap-3 min-h-[4.75rem]';

const DashboardKpiBar = memo(function DashboardKpiBar({ kpi, scopeLabel }) {
  const { dashboard: d } = ADMIN_UI;
  const { items: catalogItems } = useAttendanceStatusConfig();

  const items = useMemo(
    () => mergeBreakdownWithCatalog(kpi?.statusBreakdown, catalogItems),
    [kpi?.statusBreakdown, catalogItems],
  );

  return (
    <>
      <DashboardMobileKpiBar kpi={kpi} scopeLabel={scopeLabel} />

      <div className="hidden lg:flex lg:flex-col lg:gap-1">
        {scopeLabel && (
          <p className="text-xs text-content-muted truncate -mt-2 leading-snug" title={scopeLabel}>
            {scopeLabel}
          </p>
        )}
        <section
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 min-h-[9.5rem]"
          aria-label="Tổng hợp quân số"
        >
        <article className={CARD}>
          <div className={`${KPI_METRIC_ICON_BOX} rounded-lg flex items-center justify-center shrink-0 bg-primary-light text-primary`}>
            <Users className={KPI_METRIC_ICON_SIZE} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{kpi?.total ?? 0}</p>
            <p className="mt-1 text-2xs tracking-wider font-bold uppercase leading-snug text-black line-clamp-2 max-w-full">
              {d.kpiTotal}
            </p>
          </div>
        </article>

        {items.map((item) => (
          <KpiMetricCard
            key={item.code}
            label={item.badgeLabel || item.label}
            value={item.count ?? 0}
            iconBgClass={KPI_BG_BY_COLOR[item.colorKey] || 'bg-neutral'}
          >
            <StatusBreakdownIcon iconKey={item.iconKey} colorKey={item.colorKey} className={KPI_METRIC_ICON_SIZE} />
          </KpiMetricCard>
        ))}

        <KpiMetricCard label={d.chartUnchecked} value={kpi?.unchecked ?? 0} iconBgClass="bg-neutral">
          <span className={`${KPI_METRIC_ICON_SIZE} text-content-muted font-bold leading-none`}>—</span>
        </KpiMetricCard>
        </section>
      </div>
    </>
  );
});

export default DashboardKpiBar;
