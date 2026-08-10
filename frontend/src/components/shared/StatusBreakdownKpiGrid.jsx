import { memo } from 'react';
import { KPI_METRIC_ICON_BOX, KPI_METRIC_ICON_SIZE } from '../../constants/attendance';
import {
  KPI_BG_BY_COLOR,
  KPI_STATUS_LABEL_CLASS_METRIC,
  KPI_STATUS_LABEL_CLASS_METRIC_COMPACT,
  normalizeStatusBreakdown,
} from '../../utils/statusBreakdown';
import { StatusBreakdownIcon } from './StatusBreakdownIcon';

const CARD_SHELL =
  'bg-surface-white border border-line rounded-xl px-3 py-2.5 shadow-card flex';

export const KpiMetricCard = memo(function KpiMetricCard({
  label,
  value,
  iconBgClass,
  children,
  unit,
  unitClassName = 'text-2xs text-content-muted',
  compact = false,
}) {
  const shell = compact
    ? `${CARD_SHELL} items-center justify-start h-full min-h-[4.25rem] px-2.5 py-2`
    : `${CARD_SHELL} items-center justify-start h-full min-h-[4.75rem]`;
  const gap = compact ? 'gap-2' : 'gap-3';
  const valueClass = compact ? 'text-base' : 'text-xl';
  const labelClass = compact ? KPI_STATUS_LABEL_CLASS_METRIC_COMPACT : KPI_STATUS_LABEL_CLASS_METRIC;

  return (
    <article className={shell}>
      <div className={`flex items-center ${gap} min-w-0 w-full`}>
        <div
          className={`flex ${compact ? 'h-9 w-9' : KPI_METRIC_ICON_BOX} shrink-0 items-center justify-center rounded-lg ${iconBgClass}`}
          aria-hidden="true"
        >
          {children}
        </div>
        <div className="flex flex-col items-start justify-center text-left min-w-0 flex-1">
          {unit ? (
            <p className="flex items-baseline gap-1 leading-none">
              <span className={`${valueClass} font-bold text-gray-900 tabular-nums`}>{value}</span>
              <span className={unitClassName}>{unit}</span>
            </p>
          ) : (
            <p className={`${valueClass} font-bold text-gray-900 tabular-nums leading-none`}>{value}</p>
          )}
          <h3 className={labelClass}>{label}</h3>
        </div>
      </div>
    </article>
  );
});

const StatusBreakdownKpiGrid = memo(function StatusBreakdownKpiGrid({
  statusBreakdown,
  className = 'grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5',
  gridStyle,
  unit,
  unitClassName,
  iconSize = KPI_METRIC_ICON_SIZE,
  compact = false,
  empty = null,
}) {
  const items = normalizeStatusBreakdown(statusBreakdown);
  const resolvedIconSize = compact ? 'h-4 w-4' : iconSize;

  if (!items.length) {
    return empty;
  }

  return (
    <div className={className} style={gridStyle}>
      {items.map((item) => (
        <KpiMetricCard
          key={item.code}
          label={item.badgeLabel || item.label}
          value={item.count ?? 0}
          iconBgClass={KPI_BG_BY_COLOR[item.colorKey] || 'bg-neutral'}
          unit={unit}
          unitClassName={unitClassName}
          compact={compact}
        >
          <StatusBreakdownIcon
            iconKey={item.iconKey}
            colorKey={item.colorKey}
            className={resolvedIconSize}
          />
        </KpiMetricCard>
      ))}
    </div>
  );
});

export default StatusBreakdownKpiGrid;
