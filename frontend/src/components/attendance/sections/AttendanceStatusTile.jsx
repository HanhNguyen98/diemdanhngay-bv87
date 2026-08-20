import { memo } from 'react';
import { StatusBreakdownIcon } from '../../shared/StatusBreakdownIcon';
import {
  KPI_LABEL_CLASS_BY_COLOR,
  KPI_STATUS_LABEL_CLASS_COMPACT_DESKTOP,
  KPI_STATUS_LABEL_CLASS_DEFAULT,
  KPI_STATUS_LABEL_CLASS_PEEK,
  KPI_TILE_ICON_BG,
} from '../../../utils/statusBreakdown';

function buildChildTooltip(label, children) {
  if (!children?.length) return label;
  const parts = children.map(
    (child) => `${child.badgeLabel || child.label}: ${String(child.count ?? 0).padStart(2, '0')}`,
  );
  return `${label} — ${parts.join(' · ')}`;
}

const AttendanceStatusTile = memo(function AttendanceStatusTile({
  label,
  count,
  colorKey,
  iconKey,
  children = [],
  fluid = false,
  compact = false,
  compactDesktop = false,
  dense = false,
  peek = false,
}) {
  const displayCount = String(count ?? 0).padStart(2, '0');
  const valueColor = KPI_LABEL_CLASS_BY_COLOR[colorKey] || 'text-content-heading';
  const iconBg = KPI_TILE_ICON_BG[colorKey] || 'bg-gray-400';

  const isCompactLike = dense || peek || compactDesktop;

  const sizeClass = peek
    ? 'shrink-0 w-[calc((100%-1rem)/3.5)] min-h-[4.75rem] snap-start'
    : dense
      ? 'shrink-0 w-[6.25rem] min-h-[3.75rem] snap-start'
      : compact
        ? 'shrink-0 w-[6.75rem] min-h-[4.5rem] snap-start'
        : compactDesktop
          ? 'w-full h-full min-h-[3.25rem]'
          : fluid
            ? 'w-full h-full min-h-[5rem]'
            : '';

  const padClass = isCompactLike ? 'px-2 py-1.5' : 'px-2.5 py-2';
  const iconBoxClass = isCompactLike ? 'h-6 w-6' : 'h-8 w-8';
  const iconClass = isCompactLike ? 'h-3 w-3' : 'h-4 w-4';
  const countClass = isCompactLike ? 'text-sm font-semibold' : 'text-lg font-bold';
  const labelClass = compactDesktop
    ? KPI_STATUS_LABEL_CLASS_COMPACT_DESKTOP
    : dense || peek
      ? KPI_STATUS_LABEL_CLASS_PEEK
      : KPI_STATUS_LABEL_CLASS_DEFAULT;

  const hasChildren = children.length > 0;
  const showChildRows = hasChildren && !compactDesktop;
  const titleText = compactDesktop && hasChildren ? buildChildTooltip(label, children) : label;

  return (
    <article
      className={`rounded-xl border border-line bg-surface-white shadow-card flex flex-col justify-between min-w-0 ${padClass} ${sizeClass}`}
      title={titleText}
    >
      <div className="flex items-start justify-between gap-1">
        <div
          className={`flex ${iconBoxClass} shrink-0 items-center justify-center rounded-lg ${iconBg}`}
          aria-hidden="true"
        >
          <StatusBreakdownIcon
            iconKey={iconKey}
            colorKey={colorKey}
            className={iconClass}
            variant="onColor"
          />
        </div>
        <span className={`${countClass} tabular-nums leading-none ${valueColor}`}>
          {displayCount}
        </span>
      </div>
      <div className={compactDesktop ? 'min-w-0' : 'space-y-1'}>
        <p className={labelClass}>{label}</p>
        {showChildRows && (
          <div className="space-y-0.5 text-[0.8rem] leading-tight text-content-muted">
            {children.map((child) => (
              <div key={child.code} className="flex items-center justify-between gap-2">
                <span className="truncate">{child.badgeLabel || child.label}</span>
                <span className="shrink-0 font-semibold text-content-heading tabular-nums">
                  {String(child.count ?? 0).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
});

export default AttendanceStatusTile;
