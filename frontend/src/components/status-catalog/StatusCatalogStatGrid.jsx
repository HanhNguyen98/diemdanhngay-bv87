import { memo, useMemo } from 'react';
import { List, CheckCircle, XCircle } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import StatCard from '../shared/StatCard';

const StatusCatalogStatGrid = memo(function StatusCatalogStatGrid({ stats }) {
  const secondaryCards = useMemo(
    () => [
      {
        id: 'active',
        label: ADMIN_UI.statusCatalog.stats.active,
        value: stats?.active ?? '—',
        icon: CheckCircle,
        iconBgClass: 'bg-kpi-present',
        iconClassName: 'text-success-dark',
      },
      {
        id: 'inactive',
        label: ADMIN_UI.statusCatalog.stats.inactive,
        value: stats?.inactive ?? '—',
        icon: XCircle,
        iconBgClass: 'bg-kpi-absent',
        iconClassName: 'text-danger-dark',
      },
    ],
    [stats],
  );

  if (!stats) return null;

  return (
    <>
      <div className="lg:hidden flex flex-col gap-2">
        <StatCard
          compact
          isTotal
          label={ADMIN_UI.statusCatalog.stats.total}
          value={stats.total}
          icon={List}
          iconBgClass="bg-primary-light"
          iconClassName="text-primary"
        />

        <div className="grid grid-cols-2 gap-2" role="list" aria-label="Thống kê trạng thái làm việc">
          {secondaryCards.map((card) => {
            const { id, ...cardProps } = card;
            return (
              <StatCard key={id} compact inlineLabel className="min-w-0" {...cardProps} />
            );
          })}
        </div>
      </div>

      <div className="hidden lg:grid grid-cols-3 gap-2.5">
        <StatCard
          compact
          isTotal
          label={ADMIN_UI.statusCatalog.stats.total}
          value={stats.total}
          icon={List}
          iconBgClass="bg-primary-light"
          iconClassName="text-primary"
        />
        {secondaryCards.map((card) => {
          const { id, ...cardProps } = card;
          return <StatCard key={id} compact {...cardProps} />;
        })}
      </div>
    </>
  );
});

export default StatusCatalogStatGrid;
