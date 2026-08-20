import { memo, useMemo } from 'react';
import { KeyRound, CheckCircle, XCircle, Wifi } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import StatCard from '../shared/StatCard';

/** KPI row for fingerprint kiosk tokens — includes Agent Online (SPEC P4 §9.5.2). */
const KioskTokenStatGrid = memo(function KioskTokenStatGrid({ stats }) {
  const { stats: labels } = ADMIN_UI.fingerprintTokens;

  const secondaryCards = useMemo(
    () => [
      {
        id: 'active',
        label: labels.active,
        value: stats?.active ?? '—',
        icon: CheckCircle,
        iconBgClass: 'bg-kpi-present',
        iconClassName: 'text-success-dark',
      },
      {
        id: 'online',
        label: labels.online,
        value: stats?.online ?? '—',
        icon: Wifi,
        iconBgClass: 'bg-primary-light',
        iconClassName: 'text-primary',
      },
      {
        id: 'revoked',
        label: labels.revoked,
        value: stats?.revoked ?? '—',
        icon: XCircle,
        iconBgClass: 'bg-kpi-absent',
        iconClassName: 'text-danger-dark',
      },
    ],
    [stats, labels],
  );

  return (
    <>
      <div className="lg:hidden flex flex-col gap-2">
        <StatCard
          compact
          isTotal
          label={labels.total}
          value={stats?.total ?? '—'}
          icon={KeyRound}
          iconBgClass="bg-primary-light"
          iconClassName="text-primary"
        />
        <div className="grid grid-cols-3 gap-2" role="list" aria-label="Thống kê token vân tay">
          {secondaryCards.map((card) => {
            const { id, ...cardProps } = card;
            return <StatCard key={id} compact inlineLabel className="min-w-0" {...cardProps} />;
          })}
        </div>
      </div>

      <div className="hidden lg:grid grid-cols-4 gap-2.5">
        <StatCard
          compact
          isTotal
          label={labels.total}
          value={stats?.total ?? '—'}
          icon={KeyRound}
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

export default KioskTokenStatGrid;
