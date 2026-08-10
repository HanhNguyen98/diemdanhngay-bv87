import { memo } from 'react';
import { UI } from '../../../constants/attendance';

function ProgressRing({ percent, size = 72, showGlow = false }) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const percentTextClass =
    size <= 56
      ? 'text-4xs font-bold tabular-nums leading-none tracking-tight'
      : size <= 64
        ? 'text-3xs font-bold tabular-nums leading-none'
        : 'text-sm font-bold tabular-nums leading-none';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      {showGlow && (
        <div
          className="absolute inset-0 rounded-full bg-white/25 blur-md scale-110"
          aria-hidden="true"
        />
      )}
      <svg width={size} height={size} className="-rotate-90 relative z-[1]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-white/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-white transition-all duration-500 drop-shadow-[0_0_6px_rgba(255,255,255,0.45)]"
        />
      </svg>
      <span className={`absolute inset-0 z-[2] flex items-center justify-center text-white ${percentTextClass}`}>
        {percent}%
      </span>
    </div>
  );
}

function ProgressBadge({ label, value, uppercaseLabel = true }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-2xs text-white">
      <span
        className={`font-medium text-white/75 tracking-wide ${uppercaseLabel ? 'uppercase' : ''}`}
      >
        {label}
      </span>
      <span className="font-bold tabular-nums">{value}</span>
    </span>
  );
}

const KpiProgressWideBanner = memo(function KpiProgressWideBanner({
  markedCount,
  total,
  percent,
  rateLabel,
  compact = false,
}) {
  const remaining = Math.max(0, total - markedCount);
  const ringSize = compact ? 56 : 72;

  return (
    <article
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-[#2563EB] via-[#204FC2] to-[#1D4ED8] shadow-card flex items-center justify-between gap-4 shrink-0 ${compact ? 'px-4 py-3.5' : 'px-5 py-4 min-h-[10rem] w-[19rem] xl:w-[20rem]'
        }`}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative z-[1] min-w-0 flex-1">
        <h3 className="text-2xs font-semibold text-white/80 uppercase tracking-wider">
          {UI.kpiProgress}
        </h3>
        <p className="mt-1.5 text-3xl font-bold text-white tabular-nums leading-none">
          {markedCount}
          <span className="text-white/70 font-semibold"> / </span>
          {total}
        </p>
        {!compact && (
          <p className="mt-1.5 text-2xs text-white/85">{UI.kpiProgressSubtitle}</p>
        )}

      </div>

      <div className="relative z-[1] flex shrink-0 items-center justify-center pr-1">
        <ProgressRing percent={percent} size={ringSize} showGlow={!compact} />
      </div>
    </article>
  );
});

export default KpiProgressWideBanner;
