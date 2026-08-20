import { memo, useMemo } from 'react';
import { Users } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';
import { useAttendanceStatusConfig } from '../../../context/AttendanceStatusContext';
import { KPI_BG_BY_COLOR, mergeBreakdownWithCatalog, KPI_TOTAL_CARD_SHELL } from '../../../utils/statusBreakdown';
import { StatusBreakdownIcon } from '../../shared/StatusBreakdownIcon';
import { KpiMetricCard } from '../../shared/StatusBreakdownKpiGrid';
import DashboardMobileKpiBar from './DashboardMobileKpiBar';

/**
 * Left total — P6-StatusKpiSideTotal.
 * self-stretch (not h-full %) so height matches the 2-row status grid.
 * Floor ≈ 2× compact KpiMetricCard min-h + gap-1.5.
 */
const TOTAL_CARD =
  `${KPI_TOTAL_CARD_SHELL} px-4 py-3 flex flex-col justify-between items-start gap-2 ` +
  `shrink-0 self-stretch w-[14rem] xl:w-[15rem] min-h-[calc(2*4.25rem+0.375rem)]`;

/** Status + unchecked — 5 cols ≈ 2 rows. */
const STATUS_GRID_CLASS = 'grid grid-cols-5 gap-1.5 flex-1 min-w-0 self-stretch';

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

      <div className="hidden lg:flex lg:flex-col lg:gap-1.5">
        {scopeLabel && (
          <p className="text-xs text-content-muted truncate -mt-1 leading-snug" title={scopeLabel}>
            {scopeLabel}
          </p>
        )}

        <div
          className="flex items-stretch gap-2.5 w-full"
          aria-label="Tổng hợp quân số"
        >
          <article className={TOTAL_CARD}>
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary"
              aria-hidden="true"
            >
              <Users className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
              {kpi?.total ?? 0}
            </p>
            <p className="text-3xs tracking-wide font-bold uppercase leading-snug text-black line-clamp-2">
              {d.kpiTotal}
            </p>
          </article>

          <section className={STATUS_GRID_CLASS} aria-label="Tổng hợp theo trạng thái">
            {items.map((item) => (
              <KpiMetricCard
                key={item.code}
                label={item.badgeLabel || item.label}
                value={item.count ?? 0}
                iconBgClass={KPI_BG_BY_COLOR[item.colorKey] || 'bg-neutral'}
                compact
              >
                <StatusBreakdownIcon
                  iconKey={item.iconKey}
                  colorKey={item.colorKey}
                  className="h-4 w-4"
                />
              </KpiMetricCard>
            ))}

            <KpiMetricCard
              label={d.chartUnchecked}
              value={kpi?.unchecked ?? 0}
              iconBgClass="bg-neutral"
              compact
            >
              <span className="h-4 w-4 text-content-muted font-bold leading-none flex items-center justify-center">
                —
              </span>
            </KpiMetricCard>
          </section>
        </div>
      </div>
    </>
  );
});

export default DashboardKpiBar;
