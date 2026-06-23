import { memo } from 'react';
import { ADMIN_UI } from '../../../constants/admin';
import AccountCard from './AccountCard';

const AccountCardList = memo(function AccountCardList({
  items,
  onEdit,
  onDelete,
  onResetPassword,
  onToggleActive,
  togglingId,
}) {
  if (!items.length) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-content-muted">
        {ADMIN_UI.empty}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 p-2.5">
      {items.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          onEdit={onEdit}
          onDelete={onDelete}
          onResetPassword={onResetPassword}
          onToggleActive={onToggleActive}
          toggling={togglingId === account.id}
        />
      ))}
    </div>
  );
});

export default AccountCardList;
