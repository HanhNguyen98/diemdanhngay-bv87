import { memo } from 'react';
import { Building2, Users, BedDouble, TrendingUp } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import StatCard from '../shared/StatCard';

const DepartmentStatGrid = memo(function DepartmentStatGrid({ stats }) {
  const avgStaff =
    stats?.totalDepartments > 0
      ? Math.round(stats.totalStaff / stats.totalDepartments)
      : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
      <StatCard
        compact
        label={ADMIN_UI.departments.stats.totalDepts}
        value={stats?.totalDepartments ?? '—'}
        badge={stats?.newDepartmentsThisMonth ? `+${stats.newDepartmentsThisMonth} tháng này` : null}
        icon={Building2}
      />
      <StatCard
        compact
        label={ADMIN_UI.departments.stats.totalStaff}
        value={stats?.totalStaff ?? '—'}
        badge={stats ? `${stats.activePercent}% hoạt động` : null}
        badgeClass="bg-success text-success-fg"
        icon={Users}
      />
      <StatCard
        compact
        label={ADMIN_UI.departments.stats.avgStaff}
        value={avgStaff ?? '—'}
        badge={stats ? `${stats.activeStaff} đang làm việc` : null}
        badgeClass="bg-info text-info-fg"
        icon={BedDouble}
      />
      <StatCard
        compact
        label={ADMIN_UI.departments.stats.efficiency}
        value={stats ? `${stats.activePercent}%` : '—'}
        icon={TrendingUp}
      />
    </div>
  );
});

export default DepartmentStatGrid;
