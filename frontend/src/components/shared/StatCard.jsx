import { memo } from 'react';

const StatCard = memo(function StatCard({
  label,
  value,
  badge,
  icon: Icon,
  badgeClass = 'bg-success text-success-fg',
  badgeSolid = false,
  compact = false,
  dense = false,
}) {
  const badgeStyle = badgeSolid ? 'bg-success-fg text-white' : badgeClass;
  const shellPadding = [
    compact ? 'px-3 py-2.5' : 'p-5',
    dense ? 'max-lg:px-2 max-lg:py-2' : '',
  ].join(' ');
  const labelClass = [
    'font-semibold text-content-muted uppercase tracking-wide',
    compact ? 'text-3xs mb-0.5' : 'text-3xs mb-2',
    dense ? 'max-lg:text-4xs max-lg:mb-0.5 max-lg:leading-tight' : '',
  ].join(' ');
  const valueClass = [
    'font-bold text-gray-800 tabular-nums leading-none',
    compact ? 'text-xl' : 'text-3xl',
    dense ? 'max-lg:text-lg' : '',
  ].join(' ');
  const iconBoxClass = [
    'rounded-xl bg-primary-light flex items-center justify-center text-primary shrink-0',
    compact ? 'w-9 h-9' : 'w-11 h-11',
    dense ? 'max-lg:w-8 max-lg:h-8 max-lg:rounded-lg' : '',
  ].join(' ');
  const iconSizeClass = [
    compact ? 'w-4 h-4' : 'w-5 h-5',
    dense ? 'max-lg:w-3.5 max-lg:h-3.5' : '',
  ].join(' ');

  return (
    <div className={`bg-surface-white border border-gray-200 rounded-xl shadow-card ${shellPadding}`}>
      <div className={`flex items-center justify-between gap-3 ${dense ? 'max-lg:gap-1.5' : ''}`}>
        <div className="min-w-0 flex-1">
          <p className={labelClass}>{label}</p>
          {badge && compact ? (
            <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
              <p className={valueClass}>{value}</p>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full leading-none shrink-0 ${badgeStyle} ${
                  dense ? 'max-lg:text-4xs max-lg:px-1.5 max-lg:py-0.5' : ''
                }`}
              >
                {badge}
              </span>
            </div>
          ) : (
            <>
              <p className={valueClass}>{value}</p>
              {badge && !compact && (
                <span
                  className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${badgeStyle} mt-2.5`}
                >
                  {badge}
                </span>
              )}
            </>
          )}
        </div>
        {Icon && (
          <div className={iconBoxClass}>
            <Icon className={iconSizeClass} />
          </div>
        )}
      </div>
    </div>
  );
});

export default StatCard;
