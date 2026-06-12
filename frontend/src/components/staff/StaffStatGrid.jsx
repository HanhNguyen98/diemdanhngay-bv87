import { memo } from 'react';
import { Users, Building2, UserX } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import StatCard from '../shared/StatCard';

const StaffStatGrid = memo(function StaffStatGrid({ stats, mobileCompact = false }) {
  const inactiveCount = stats ? stats.totalStaff - stats.activeStaff : null;

  return (
    <div
      className={`grid gap-2 lg:gap-2.5 ${
        mobileCompact ? 'grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
      }`}
    >
      <StatCard
        compact
        dense={mobileCompact}
        label={ADMIN_UI.staff.stats.totalStaff}
        value={stats?.totalStaff ?? '—'}
        icon={Users}
      />
      <StatCard
        compact
        dense={mobileCompact}
        label={ADMIN_UI.staff.stats.activeStaff}
        value={stats?.activeStaff ?? '—'}
        badge={stats ? `${stats.activePercent}%` : null}
        badgeClass="bg-success text-success-fg"
        icon={Users}
      />
      <StatCard
        compact
        dense={mobileCompact}
        label={ADMIN_UI.staff.stats.totalDepts}
        value={stats?.totalDepartments ?? '—'}
        icon={Building2}
      />
      <StatCard
        compact
        dense={mobileCompact}
        label={ADMIN_UI.staff.stats.inactive}
        value={inactiveCount ?? '—'}
        badgeClass="bg-neutral text-neutral-fg"
        icon={UserX}
      />
    </div>
  );
});

export default StaffStatGrid;
