import { memo } from 'react';
import { ADMIN_UI } from '../../../constants/admin';
import StaffCard from './StaffCard';

const StaffCardList = memo(function StaffCardList({
  items,
  onEdit,
  onDelete,
  onHistory,
  onTransfer,
  onDeleteFingerprint,
  avatarOnly = false,
  hideDeptColumn = false,
}) {
  if (!items.length) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-content-muted">
        {ADMIN_UI.empty}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2.5">
      {items.map((staff) => (
        <StaffCard
          key={staff.empCode}
          staff={staff}
          avatarOnly={avatarOnly}
          hideDeptColumn={hideDeptColumn}
          onEdit={onEdit}
          onDelete={onDelete}
          onHistory={onHistory}
          onTransfer={onTransfer}
          onDeleteFingerprint={onDeleteFingerprint}
        />
      ))}
    </div>
  );
});

export default StaffCardList;
