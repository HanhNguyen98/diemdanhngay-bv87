import { memo } from 'react';
import { KPI_METRIC_ICON_BOX, KPI_METRIC_ICON_SIZE, STATISTICS_UI, UI } from '../../../constants/attendance';
import { DI_HOC_ICON_BG, DI_HOC_ICON_COLOR, DiHocIcon } from '../../shared/DiHocIcon';
import { IconBriefcase, IconCheckCircle, IconXCircle } from '../../icons/Icons';

/** Cùng shell với KpiBar màn chấm công */
const CARD_SHELL =
  'bg-surface-white border border-line rounded-xl px-3 py-2.5 shadow-card flex';

const KpiMetricCard = memo(function KpiMetricCard({ label, value, iconBgClass, children }) {
  return (
    <article className={`${CARD_SHELL} items-center justify-start`}>
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex ${KPI_METRIC_ICON_BOX} shrink-0 items-center justify-center rounded-lg ${iconBgClass}`}
          aria-hidden="true"
        >
          {children}
        </div>

        <div className="flex flex-col items-start justify-center text-left min-w-0">
          <p className="flex items-baseline gap-1.5 leading-none">
            <span className="text-xl font-bold text-gray-900 tabular-nums">{value}</span>
            <span className="text-2xs text-content-muted">{STATISTICS_UI.kpiUnit}</span>
          </p>
          <h3 className="mt-1 text-2xs font-semibold text-content-muted uppercase tracking-wider leading-none">
            {label}
          </h3>
        </div>
      </div>
    </article>
  );
});

const StatisticsKpiCards = memo(function StatisticsKpiCards({ stats }) {
  return (
    <section
      className="hidden lg:grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Tổng hợp thống kê chấm công"
    >
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
    </section>
  );
});

export default StatisticsKpiCards;
