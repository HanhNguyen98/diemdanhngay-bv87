import { memo } from 'react';

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
  labelLineClamp = false,
  labelNowrap = false,
  inlineLabel = false,
  mobileStatus = false,
}) {
  const badgeStyle = badgeSolid ? 'bg-success-fg text-white' : badgeClass;

  if (compact) {
    if (inlineLabel) {
      return (
        <article
          className={`bg-surface-white border border-line rounded-xl shadow-card flex items-center h-full px-2 py-2 min-h-[3.25rem] ${className}`}
        >
          <div className="flex items-center gap-1.5 min-w-0 w-full">
            {Icon && (
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconBgClass}`}
                aria-hidden="true"
              >
                <Icon className={`w-3.5 h-3.5 ${iconClassName}`} />
              </div>
            )}
            <div className="flex items-baseline gap-1 min-w-0 flex-1 overflow-hidden">
              <span className="text-sm font-bold text-gray-900 tabular-nums leading-none shrink-0">
                {value}
              </span>
              <span className="text-[0.625rem] font-semibold text-content-muted uppercase tracking-wide leading-tight line-clamp-2 min-w-0">
                {label}
              </span>
            </div>
          </div>
        </article>
      );
    }

    const shell = mobileStatus
      ? 'px-3 py-3 min-h-[4.5rem]'
      : labelNowrap && dense
        ? 'px-2 py-2 h-[3.5rem] overflow-hidden'
        : dense
          ? 'px-2 py-2 min-h-[3.5rem]'
          : 'px-3 py-2.5 min-h-[4.25rem]';
    const gap = mobileStatus ? 'gap-2' : dense ? 'gap-1.5' : 'gap-2';
    const iconBox = mobileStatus ? 'h-9 w-9 rounded-lg' : dense ? 'h-8 w-8 rounded-lg' : 'h-9 w-9 rounded-lg';
    const iconSize = mobileStatus ? 'w-4 h-4' : dense ? 'w-3.5 h-3.5' : 'w-4 h-4';
    const valueSize = mobileStatus ? 'text-lg' : dense ? 'text-base' : 'text-xl';
    const labelSize = mobileStatus
      ? 'text-2xs'
      : labelNowrap
        ? 'text-[0.5625rem]'
        : dense
          ? 'text-4xs'
          : 'text-3xs';

    const labelClampClass = mobileStatus
      ? 'leading-snug'
      : labelLineClamp
        ? 'line-clamp-2 whitespace-normal'
        : labelNowrap
          ? 'whitespace-nowrap leading-none tracking-normal overflow-hidden'
          : 'truncate';

    const labelClassName = mobileStatus || labelNowrap
      ? `mt-1 ${labelSize} font-semibold text-content-muted normal-case max-w-full ${labelClampClass}`
      : `mt-0.5 ${labelSize} font-semibold text-content-muted uppercase tracking-wide leading-snug max-w-full ${labelClampClass}`;

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
            {badge ? (
              <p className="flex items-baseline gap-1 min-w-0 leading-none flex-wrap">
                <span className={`${valueSize} font-bold text-gray-900 tabular-nums`}>{value}</span>
              
              </p>
            ) : (
              <p className={`${valueSize} font-bold text-gray-900 tabular-nums leading-none`}>{value}</p>
            )}
            <h3 className={labelClassName}>
              {label}
            </h3>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="bg-surface-white border border-gray-200 rounded-xl shadow-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-3xs font-semibold text-content-muted uppercase tracking-wide mb-2">{label}</p>
          <p className="text-3xl font-bold text-gray-800 tabular-nums leading-none">{value}</p>
          {badge && (
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${badgeStyle} mt-2.5`}>
              {badge}
            </span>
          )}
        </div>
        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center text-primary shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
});

export default StatCard;
