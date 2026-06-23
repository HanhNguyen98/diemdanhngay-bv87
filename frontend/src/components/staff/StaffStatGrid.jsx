import { memo, useMemo } from 'react';
import { Users, UserX } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import StatCard from '../shared/StatCard';

const StaffStatGrid = memo(function StaffStatGrid({ stats, mobileCompact = false }) {
  const inactiveCount = stats ? stats.totalStaff - stats.activeStaff : null;

  const secondaryCards = useMemo(
    () => [
      {
        id: 'activeStaff',
        label: ADMIN_UI.staff.stats.activeStaff,
        value: stats?.activeStaff ?? '—',
        badge: stats ? `${stats.activePercent}%` : null,
        badgeClass: 'bg-success text-success-fg',
        iconBgClass: 'bg-kpi-present',
        iconClassName: 'text-success-dark',
        icon: Users,
      },
      {
        id: 'inactive',
        label: ADMIN_UI.staff.stats.inactive,
        value: inactiveCount ?? '—',
        badgeClass: 'bg-neutral text-neutral-fg',
        iconBgClass: 'bg-neutral',
        iconClassName: 'text-neutral-fg',
        icon: UserX,
      },
    ],
    [stats, inactiveCount],
  );

  const dense = mobileCompact;

  return (
    <>
      <div className="lg:hidden flex flex-col gap-2">
        <StatCard
          compact
          label={ADMIN_UI.staff.stats.totalStaff}
          value={stats?.totalStaff ?? '—'}
          icon={Users}
        />

        <div className="grid grid-cols-2 gap-2" role="list" aria-label="Thống kê nhân viên">
          {secondaryCards.map((card) => {
            const { id, badge, ...cardProps } = card;
            return (
              <StatCard key={id} compact inlineLabel className="min-w-0" {...cardProps} />
            );
          })}
        </div>
      </div>

      <div className="hidden lg:grid grid-cols-3 gap-2.5">
        <StatCard
          compact
          dense={dense}
          label={ADMIN_UI.staff.stats.totalStaff}
          value={stats?.totalStaff ?? '—'}
          icon={Users}
        />
        {secondaryCards.map((card) => {
          const { id, ...cardProps } = card;
          return <StatCard key={id} compact dense={dense} {...cardProps} />;
        })}
      </div>
    </>
  );
});

export default StaffStatGrid;
