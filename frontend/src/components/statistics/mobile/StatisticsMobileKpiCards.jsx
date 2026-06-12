import { memo } from 'react';
import { STATISTICS_UI } from '../../../constants/attendance';
import { DI_HOC_ICON_COLOR, DiHocIcon } from '../../shared/DiHocIcon';
import { IconBriefcase, IconCheckCircle, IconXCircle } from '../../icons/Icons';

const MOBILE_ICON_BOX = 'h-9 w-9';
const MOBILE_INNER_CIRCLE = 'h-6 w-6';
const MOBILE_INNER_ICON = 'h-3.5 w-3.5';
const MOBILE_DIRECT_ICON = 'h-4 w-4';

const CARD_SHELL =
  'bg-surface-white border border-line rounded-xl px-2.5 py-2 shadow-card flex items-center gap-2.5';

const KPI_ITEMS = [
  {
    key: 'diLam',
    label: STATISTICS_UI.chartLegendPresent,
    labelClass: 'text-success-dark',
    outerBg: 'bg-kpi-present',
    innerBg: 'bg-success-fg',
    Icon: IconCheckCircle,
    iconClass: 'text-white',
    useInnerCircle: true,
  },
  {
    key: 'nghiPhep',
    label: STATISTICS_UI.chartLegendAbsent,
    labelClass: 'text-danger-dark',
    outerBg: 'bg-kpi-absent',
    innerBg: 'bg-danger-fg',
    Icon: IconXCircle,
    iconClass: 'text-white',
    useInnerCircle: true,
  },
  {
    key: 'diHoc',
    label: STATISTICS_UI.chartLegendStudy,
    labelClass: 'text-warning-dark',
    outerBg: 'bg-kpi-duty',
    Icon: DiHocIcon,
    iconClass: DI_HOC_ICON_COLOR,
    useInnerCircle: false,
  },
  {
    key: 'diCongTac',
    label: STATISTICS_UI.chartLegendTrip,
    labelClass: 'text-primary',
    outerBg: 'bg-info',
    innerBg: 'bg-primary',
    Icon: IconBriefcase,
    iconClass: 'text-white',
    useInnerCircle: true,
  },
];

function KpiIconBox({ outerBg, innerBg, Icon, iconClass, useInnerCircle }) {
  return (
    <div
      className={`flex ${MOBILE_ICON_BOX} shrink-0 items-center justify-center rounded-lg ${outerBg}`}
      aria-hidden="true"
    >
      {useInnerCircle ? (
        <div className={`flex ${MOBILE_INNER_CIRCLE} items-center justify-center rounded-full ${innerBg}`}>
          <Icon className={`${MOBILE_INNER_ICON} ${iconClass}`} />
        </div>
      ) : (
        <Icon className={`${MOBILE_DIRECT_ICON} ${iconClass}`} />
      )}
    </div>
  );
}

const MobileKpiCard = memo(function MobileKpiCard({
  label,
  labelClass,
  value,
  outerBg,
  innerBg,
  Icon,
  iconClass,
  useInnerCircle,
}) {
  const displayValue = String(value ?? 0).padStart(2, '0');

  return (
    <article className={CARD_SHELL}>
      <KpiIconBox
        outerBg={outerBg}
        innerBg={innerBg}
        Icon={Icon}
        iconClass={iconClass}
        useInnerCircle={useInnerCircle}
      />
      <div className="min-w-0 flex flex-col justify-center">
        <p className="flex items-baseline gap-1 leading-none">
          <span className="text-lg font-bold text-gray-900 tabular-nums">{displayValue}</span>
          <span className="text-4xs font-medium text-content-muted uppercase">
            {STATISTICS_UI.mobileKpiUnit}
          </span>
        </p>
        <p className={`mt-1 text-4xs font-bold uppercase tracking-wide ${labelClass}`}>{label}</p>
      </div>
    </article>
  );
});

const StatisticsMobileKpiCards = memo(function StatisticsMobileKpiCards({ stats }) {
  return (
    <section
      className="grid grid-cols-2 gap-2 lg:hidden"
      aria-label="Tổng hợp thống kê chấm công"
    >
      {KPI_ITEMS.map((item) => (
        <MobileKpiCard
          key={item.key}
          label={item.label}
          labelClass={item.labelClass}
          value={stats?.[item.key] ?? 0}
          outerBg={item.outerBg}
          innerBg={item.innerBg}
          Icon={item.Icon}
          iconClass={item.iconClass}
          useInnerCircle={item.useInnerCircle}
        />
      ))}
    </section>
  );
});

export default StatisticsMobileKpiCards;
