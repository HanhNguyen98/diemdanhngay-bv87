import { memo } from 'react';
import { KPI_METRIC_ICON_BOX, KPI_METRIC_ICON_SIZE, UI } from '../../../constants/attendance';
import { DI_HOC_ICON_BG, DI_HOC_ICON_COLOR, DiHocIcon } from '../../shared/DiHocIcon';
import { IconBriefcase, IconCheckCircle, IconXCircle } from '../../icons/Icons';

const CARD_SHELL =
  'bg-surface-white border border-line rounded-xl px-3 py-2.5 shadow-card flex';

function ProgressRing({ percent, size = 44, variant = 'default' }) {
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const onPrimary = variant === 'onPrimary';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className={onPrimary ? 'text-white/25' : 'text-gray-200'}
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
          className={`transition-all duration-500 ${onPrimary ? 'text-white' : 'text-primary'}`}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
          onPrimary ? 'text-white' : 'text-content-heading'
        }`}
      >
        {percent}%
      </span>
    </div>
  );
}

const KpiProgressCard = memo(function KpiProgressCard({ markedCount, total, percent }) {
  return (
    <article className="rounded-xl px-4 py-3 bg-[#204FC2] shadow-card flex items-center justify-between gap-3">
      <div className="min-w-0 text-left">
        <h3 className="text-2xs font-semibold text-white/80 uppercase tracking-wider">
          {UI.kpiProgress}
        </h3>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 text-left">
          <span className="text-xl font-bold text-white tabular-nums">
            {markedCount} / {total}
          </span>
          <span className="text-sm font-normal text-white/90">{UI.employees}</span>
        </p>
      </div>
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15">
        <ProgressRing percent={percent} size={46} variant="onPrimary" />
      </div>
    </article>
  );
});

const KpiMetricCard = memo(function KpiMetricCard({ label, value, iconBgClass, children }) {
  return (
    <article className={`${CARD_SHELL} items-center justify-start`}>
      <div className="flex items-center gap-3">
        <div
          className={`flex ${KPI_METRIC_ICON_BOX} shrink-0 items-center justify-center rounded-lg ${iconBgClass}`}
          aria-hidden="true"
        >
          {children}
        </div>

        <div className="flex flex-col items-start justify-center text-left">
          <h3 className="text-2xs font-semibold text-content-muted uppercase tracking-wider leading-none">
            {label}
          </h3>
          <p className="mt-1 text-xl font-bold text-gray-900 leading-none tabular-nums">
            {value}
          </p>
        </div>
      </div>
    </article>
  );
});

const KpiBar = memo(function KpiBar({ markedCount, total, stats }) {
  const percent = total > 0 ? Math.round((markedCount / total) * 100) : 0;

  return (
    <section
      className="grid grid-cols-1 gap-2.5 lg:grid-cols-5"
      aria-label="Tổng hợp chấm công"
    >
      <KpiProgressCard markedCount={markedCount} total={total} percent={percent} />

      <div className="hidden lg:contents">
        <KpiMetricCard label={UI.kpiPresent} value={stats?.diLam ?? 0} iconBgClass="bg-kpi-present">
          <IconCheckCircle className={`${KPI_METRIC_ICON_SIZE} text-success-dark`} />
        </KpiMetricCard>

        <KpiMetricCard label={UI.kpiAbsent} value={stats?.nghiPhep ?? 0} iconBgClass="bg-kpi-absent">
          <IconXCircle className={`${KPI_METRIC_ICON_SIZE} text-danger-dark`} />
        </KpiMetricCard>

        <KpiMetricCard label={UI.kpiStudy} value={stats?.diHoc ?? 0} iconBgClass={DI_HOC_ICON_BG}>
          <DiHocIcon className={`${KPI_METRIC_ICON_SIZE} ${DI_HOC_ICON_COLOR}`} />
        </KpiMetricCard>

        <KpiMetricCard label={UI.kpiDuty} value={stats?.diCongTac ?? 0} iconBgClass="bg-info">
          <IconBriefcase className={`${KPI_METRIC_ICON_SIZE} text-primary`} />
        </KpiMetricCard>
      </div>
    </section>
  );
});

export default KpiBar;
