import { memo } from 'react';
import { Shield, UserCheck, Users, UserCog } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import StatCard from '../shared/StatCard';

const AccountStatGrid = memo(function AccountStatGrid({ stats }) {
  const { stats: labels } = ADMIN_UI.accounts;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
      <StatCard compact label={labels.total} value={stats?.total ?? '—'} icon={Users} />
      <StatCard compact label={labels.active} value={stats?.active ?? '—'} icon={UserCheck} />
      <StatCard compact label={labels.admin} value={stats?.admin ?? '—'} icon={Shield} />
      <StatCard compact label={labels.head} value={stats?.head ?? '—'} icon={UserCog} />
    </div>
  );
});

export default AccountStatGrid;
