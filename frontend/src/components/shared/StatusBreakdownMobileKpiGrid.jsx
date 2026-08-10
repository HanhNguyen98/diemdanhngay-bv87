import { memo } from 'react';
import { STATISTICS_UI } from '../../constants/attendance';
import {
  KPI_BG_BY_COLOR,
  KPI_STATUS_LABEL_CLASS,
  normalizeStatusBreakdown,
} from '../../utils/statusBreakdown';
import { StatusBreakdownIcon } from './StatusBreakdownIcon';

const MOBILE_ICON_BOX = 'h-9 w-9';
const MOBILE_DIRECT_ICON = 'h-4 w-4';
const CARD_SHELL =
  'bg-surface-white border border-line rounded-xl px-2.5 py-2.5 shadow-card flex items-center gap-2.5 min-h-[4.75rem]';

const MobileKpiCard = memo(function MobileKpiCard({ label, value, outerBg, item }) {
  return (
    <article className={CARD_SHELL}>
      <div
        className={`flex ${MOBILE_ICON_BOX} shrink-0 items-center justify-center rounded-lg ${outerBg}`}
        aria-hidden="true"
      >
        <StatusBreakdownIcon
          iconKey={item.iconKey}
          colorKey={item.colorKey}
          className={MOBILE_DIRECT_ICON}
        />
      </div>
      <div className="min-w-0 flex flex-col justify-center">
        <p className="flex items-baseline gap-1 leading-none">
          <span className="text-lg font-bold text-gray-900 tabular-nums">{value ?? 0}</span>
          <span className="text-4xs font-medium text-content-muted uppercase">
            {STATISTICS_UI.mobileKpiUnit}
          </span>
        </p>
        <p className={`mt-1 text-4xs leading-snug tracking-wide ${KPI_STATUS_LABEL_CLASS}`}>{label}</p>
      </div>
    </article>
  );
});

const StatusBreakdownMobileKpiGrid = memo(function StatusBreakdownMobileKpiGrid({
  statusBreakdown,
  className = 'grid grid-cols-2 gap-2 lg:hidden',
}) {
  const items = normalizeStatusBreakdown(statusBreakdown);

  return (
    <section className={className} aria-label="Tổng hợp thống kê Chấm công">
      {items.map((item) => (
        <MobileKpiCard
          key={item.code}
          label={item.badgeLabel || item.label}
          value={item.count}
          outerBg={KPI_BG_BY_COLOR[item.colorKey] || 'bg-neutral'}
          item={item}
        />
      ))}
    </section>
  );
});

export default StatusBreakdownMobileKpiGrid;
