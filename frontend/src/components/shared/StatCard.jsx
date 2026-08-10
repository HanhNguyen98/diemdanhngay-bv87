import { memo } from 'react';
import {
  KPI_STATUS_LABEL_CLASS_DEFAULT,
  KPI_STATUS_LABEL_CLASS_METRIC,
  KPI_STATUS_LABEL_CLASS_METRIC_COMPACT,
} from '../../utils/statusBreakdown';

const StatCard = memo(function StatCard({
  label,
  value,
  badge,
  icon: Icon,
  badgeClass = 'bg-success text-success-fg',
  badgeSolid = false,
  iconBgClass = 'bg-primary-light',
  iconClassName = 'text-primary',
  compact = false,
  dense = false,
  className = '',
  inlineLabel = false,
  mobileStatus = false,
}) {
  const badgeStyle = badgeSolid ? 'bg-success-fg text-white' : badgeClass;

  if (compact) {
    const shell = mobileStatus
      ? 'px-3 py-2.5 min-h-[4.75rem]'
      : dense
        ? 'px-2.5 py-2 min-h-[4.25rem]'
        : 'px-3 py-2.5 min-h-[4.75rem]';
    const gap = mobileStatus ? 'gap-2.5' : dense || inlineLabel ? 'gap-2' : 'gap-3';
    const iconBox = mobileStatus ? 'h-9 w-9 rounded-lg' : dense ? 'h-8 w-8 rounded-lg' : 'h-9 w-9 rounded-lg';
    const iconSize = mobileStatus ? 'w-4 h-4' : dense ? 'w-3.5 h-3.5' : 'w-4 h-4';
    const valueSize = mobileStatus ? 'text-lg' : dense ? 'text-base' : 'text-xl';
    const labelClassName = mobileStatus
      ? 'mt-1 text-2xs font-medium text-content-muted normal-case leading-snug max-w-full'
      : inlineLabel
        ? KPI_STATUS_LABEL_CLASS_METRIC_COMPACT
        : dense
          ? KPI_STATUS_LABEL_CLASS_METRIC_COMPACT
          : KPI_STATUS_LABEL_CLASS_METRIC;

    return (
      <article
        className={`bg-surface-white border border-line rounded-xl shadow-card flex items-center justify-start h-full ${shell} ${className}`}
      >
        <div className={`flex items-center ${gap} min-w-0 w-full h-full`}>
          {Icon && (
            <div
              className={`flex ${iconBox} shrink-0 items-center justify-center ${iconBgClass}`}
              aria-hidden="true"
            >
              <Icon className={`${iconSize} ${iconClassName}`} />
            </div>
          )}
          <div
            className={`flex flex-col items-start justify-center text-left min-w-0 flex-1 ${
              mobileStatus ? '' : 'overflow-hidden'
            }`}
          >
            <p className={`${valueSize} font-bold text-gray-900 tabular-nums leading-none`}>{value}</p>
          
            <h3 className={labelClassName}>{label}</h3>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="bg-surface-white border border-line rounded-xl shadow-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`mb-2 ${KPI_STATUS_LABEL_CLASS_DEFAULT}`}>{label}</p>
          <p className="text-3xl font-bold text-gray-900 tabular-nums leading-none">{value}</p>
          {badge && (
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${badgeStyle} mt-2.5`}>
              {badge}
            </span>
          )}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBgClass}`}>
            <Icon className={`w-5 h-5 ${iconClassName}`} />
          </div>
        )}
      </div>
    </div>
  );
});

export default StatCard;
