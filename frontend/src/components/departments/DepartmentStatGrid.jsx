import { memo, useMemo } from 'react';
import { Building2, Users, TrendingUp } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import StatCard from '../shared/StatCard';

const DepartmentStatGrid = memo(function DepartmentStatGrid({ stats }) {
  const secondaryCards = useMemo(
    () => [
      {
        id: 'totalStaff',
        label: ADMIN_UI.departments.stats.totalStaff,
        value: stats?.totalStaff ?? '—',
        iconBgClass: 'bg-kpi-present',
        iconClassName: 'text-success-dark',
        icon: Users,
      },
      {
        id: 'efficiency',
        label: ADMIN_UI.departments.stats.efficiency,
        value: stats ? `${stats.activePercent}%` : '—',
        iconBgClass: 'bg-kpi-duty',
        iconClassName: 'text-warning-dark',
        icon: TrendingUp,
      },
    ],
    [stats],
  );

  return (
    <>
      <div className="lg:hidden flex flex-col gap-2">
        <StatCard
          compact
          isTotal
          label={ADMIN_UI.departments.stats.totalDepts}
          value={stats?.totalDepartments ?? '—'}
          badge={stats?.newDepartmentsThisMonth ? `+${stats.newDepartmentsThisMonth} tháng này` : null}
          badgeClass="bg-info text-info-fg"
          icon={Building2}
        />

        <div className="grid grid-cols-2 gap-2" role="list" aria-label="Thống kê đơn vị">
          {secondaryCards.map((card) => {
            const { id, ...cardProps } = card;
            return (
              <StatCard
                key={id}
                compact
                isTotal={card.id === 'totalStaff'}
                inlineLabel
                className="min-w-0"
                {...cardProps}
              />
            );
          })}
        </div>
      </div>

      <div className="hidden lg:grid grid-cols-3 gap-2.5">
        <StatCard
          compact
          isTotal
          label={ADMIN_UI.departments.stats.totalDepts}
          value={stats?.totalDepartments ?? '—'}
          badge={stats?.newDepartmentsThisMonth ? `+${stats.newDepartmentsThisMonth} tháng này` : null}
          badgeClass="bg-info text-info-fg"
          icon={Building2}
        />
        {secondaryCards.map((card) => {
          const { id, ...cardProps } = card;
          return (
            <StatCard
              key={id}
              compact
              isTotal={card.id === 'totalStaff'}
              badge={card.id === 'totalStaff' && stats ? `${stats.activePercent}% hoạt động` : null}
              badgeClass="bg-success text-success-fg"
              {...cardProps}
            />
          );
        })}
      </div>
    </>
  );
});

export default DepartmentStatGrid;
