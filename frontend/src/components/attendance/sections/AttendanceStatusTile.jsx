import { memo } from 'react';
import { StatusBreakdownIcon } from '../../shared/StatusBreakdownIcon';
import {
  KPI_LABEL_CLASS_BY_COLOR,
  KPI_TILE_ICON_BG,
} from '../../../utils/statusBreakdown';

const AttendanceStatusTile = memo(function AttendanceStatusTile({
  label,
  count,
  colorKey,
  iconKey,
  fluid = false,
  compact = false,
  dense = false,
  peek = false,
}) {
  const displayCount = String(count ?? 0).padStart(2, '0');
  const valueColor = KPI_LABEL_CLASS_BY_COLOR[colorKey] || 'text-content-heading';
  const iconBg = KPI_TILE_ICON_BG[colorKey] || 'bg-gray-400';

  const sizeClass = peek
    ? 'shrink-0 w-[calc((100%-1rem)/3.5)] min-h-[4.5rem] h-[4.5rem] snap-start'
    : dense
      ? 'shrink-0 w-[6.25rem] h-[3.5rem] snap-start'
      : compact
        ? 'shrink-0 w-[6.75rem] h-[4.25rem] snap-start'
        : fluid
          ? 'w-full h-full min-h-[4.75rem]'
          : '';

  const padClass = dense || peek ? 'px-2 py-1.5' : 'px-2.5 py-2';
  const iconBoxClass = dense || peek ? 'h-6 w-6' : 'h-8 w-8';
  const iconClass = dense || peek ? 'h-3 w-3' : 'h-4 w-4';
  const countClass = dense || peek ? 'text-sm font-semibold' : 'text-lg font-bold';
  const labelClass =
    dense || peek
      ? 'text-[0.625rem] leading-[1.2] font-medium uppercase tracking-tight text-gray-700 line-clamp-2'
      : 'text-3xs font-bold uppercase leading-tight text-gray-800 line-clamp-2';

  return (
    <article
      className={`rounded-xl border border-line bg-surface-white shadow-card flex flex-col justify-between min-w-0 ${padClass} ${sizeClass}`}
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
      <p className={labelClass}>{label}</p>
    </article>
  );
});

export default AttendanceStatusTile;
