import { memo } from 'react';
import { ADMIN_UI } from '../../../constants/admin';
import DepartmentCard from './DepartmentCard';

const DepartmentCardList = memo(function DepartmentCardList({
  items,
  showGroupName = false,
  onEdit,
  onDelete,
  onViewLocation,
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
      {items.map((dept) => (
        <DepartmentCard
          key={dept.deptCode}
          dept={dept}
          showGroupName={showGroupName}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewLocation={onViewLocation}
        />
      ))}
    </div>
  );
});

export default DepartmentCardList;
