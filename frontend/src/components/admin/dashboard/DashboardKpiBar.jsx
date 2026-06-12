import { memo } from 'react';
import { Users, Briefcase, CalendarX } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';
import { KPI_METRIC_ICON_BOX, KPI_METRIC_ICON_SIZE } from '../../../constants/attendance';
import { DI_HOC_ICON_BG, DI_HOC_ICON_COLOR, DiHocIcon } from '../../shared/DiHocIcon';
import { IconBriefcase } from '../../icons/Icons';

const CARD = 'bg-surface-white border border-gray-200 rounded-xl px-4 py-3 shadow-card flex items-center gap-3';

function KpiCard({ icon: Icon, iconBg, label, value, iconClassName = KPI_METRIC_ICON_SIZE }) {
  return (
    <article className={CARD}>
      <div className={`${KPI_METRIC_ICON_BOX} rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={iconClassName} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{value}</p>
        <p className="text-3xs font-semibold text-content-muted uppercase mt-1">{label}</p>
      </div>
    </article>
  );
}

const DashboardKpiBar = memo(function DashboardKpiBar({ kpi }) {
  const { dashboard: d } = ADMIN_UI;
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      <KpiCard icon={Users} iconBg="bg-primary-light text-primary" label={d.kpiTotal} value={kpi?.total ?? 0} />
      <KpiCard icon={Briefcase} iconBg="bg-kpi-present text-success-dark" label={d.kpiPresent} value={kpi?.diLam ?? 0} />
      <KpiCard icon={CalendarX} iconBg="bg-kpi-absent text-danger-dark" label={d.kpiAbsent} value={kpi?.nghiPhep ?? 0} />
      <KpiCard
        icon={DiHocIcon}
        iconBg={DI_HOC_ICON_BG}
        iconClassName={`${KPI_METRIC_ICON_SIZE} ${DI_HOC_ICON_COLOR}`}
        label={d.kpiStudy}
        value={kpi?.diHoc ?? 0}
      />
      <KpiCard
        icon={IconBriefcase}
        iconBg="bg-info"
        iconClassName={`${KPI_METRIC_ICON_SIZE} text-primary`}
        label={d.kpiDuty}
        value={kpi?.diCongTac ?? 0}
      />
    </section>
  );
});

export default DashboardKpiBar;
