import { memo, useMemo } from 'react';
import { Users } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';
import { KPI_METRIC_ICON_BOX, KPI_METRIC_ICON_SIZE } from '../../../constants/attendance';
import { useAttendanceStatusConfig } from '../../../context/AttendanceStatusContext';
import { mergeBreakdownWithCatalog, KPI_STATUS_LABEL_CLASS_PEEK } from '../../../utils/statusBreakdown';
import AttendanceStatusTile from '../../attendance/sections/AttendanceStatusTile';
import MobileHorizontalScroll from '../../shared/MobileHorizontalScroll';

const TOTAL_CARD =
  'bg-surface-white border border-line rounded-xl px-3 py-2.5 shadow-card flex items-center gap-2.5 min-h-[4.75rem]';

/** ~3.5 card visible; đủ cao cho nhãn 2 dòng (ĐI CÔNG TÁC, CHƯA CHẤM) */
export const ADMIN_KPI_PEEK_TILE_CLASS =
  'shrink-0 w-[calc((100%-1rem)/3.5)] min-h-[4.75rem] snap-start';

const SCROLL_INNER_CLASS = 'gap-2 snap-x snap-mandatory pb-0.5 pr-1';

const DashboardMobileKpiBar = memo(function DashboardMobileKpiBar({ kpi, scopeLabel }) {
  const { dashboard: d } = ADMIN_UI;
  const { items: catalogItems } = useAttendanceStatusConfig();

  const items = useMemo(
    () => mergeBreakdownWithCatalog(kpi?.statusBreakdown, catalogItems),
    [kpi?.statusBreakdown, catalogItems],
  );
  const unchecked = kpi?.unchecked ?? 0;
  const totalCards = items.length + 1;
  const showScrollPeek = totalCards > 3;

  return (
    <section className="lg:hidden flex flex-col gap-1.5 min-w-0 max-w-full" aria-label="Tổng hợp quân số">
      {scopeLabel && (
        <p className="text-xs text-content-muted truncate px-0.5 -mt-0.5 leading-snug" title={scopeLabel}>
          {scopeLabel}
        </p>
      )}
      <article className={TOTAL_CARD}>
        <div
          className={`${KPI_METRIC_ICON_BOX} rounded-lg flex items-center justify-center shrink-0 bg-primary-light text-primary`}
        >
          <Users className={KPI_METRIC_ICON_SIZE} />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-gray-900 tabular-nums leading-none">{kpi?.total ?? 0}</p>
          <p className="mt-1 text-4xs font-bold uppercase leading-snug tracking-wide text-black line-clamp-2">
            {d.kpiTotal}
          </p>
        </div>
      </article>

      <MobileHorizontalScroll
        ariaLabel="Thống kê theo trạng thái"
        innerClassName={SCROLL_INNER_CLASS}
        showFade={showScrollPeek}
      >
        {items.map((item) => (
          <AttendanceStatusTile
            key={item.code}
            label={item.badgeLabel || item.label}
            count={item.count}
            colorKey={item.colorKey}
            iconKey={item.iconKey}
            peek
          />
        ))}
        <article
          className={`${ADMIN_KPI_PEEK_TILE_CLASS} rounded-xl border border-line bg-surface-white shadow-card px-2 py-1.5 flex flex-col justify-between min-w-0`}
          role="listitem"
        >
          <div className="flex items-start justify-between gap-1">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gray-400"
              aria-hidden="true"
            >
              <span className="text-3xs font-semibold text-white leading-none">—</span>
            </div>
            <span className="text-sm font-semibold tabular-nums leading-none text-content-muted">
              {String(unchecked).padStart(2, '0')}
            </span>
          </div>
          <p className={KPI_STATUS_LABEL_CLASS_PEEK}>{d.chartUnchecked}</p>
        </article>
      </MobileHorizontalScroll>
    </section>
  );
});

export default DashboardMobileKpiBar;
