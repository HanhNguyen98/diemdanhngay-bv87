import { memo } from 'react';
import { ADMIN_UI } from '../../../constants/admin';
import DepartmentGroupCard from './DepartmentGroupCard';

const DepartmentGroupCardList = memo(function DepartmentGroupCardList({
  items,
  onEdit,
  onDelete,
}) {
  if (!items?.length) {
    return (
      <p className="text-center py-10 text-content-muted">{ADMIN_UI.empty}</p>
    );
  }

  return (
    <div className="flex flex-col gap-3" role="list" aria-label={ADMIN_UI.departmentGroups.manageTitle}>
      {items.map((group) => (
        <DepartmentGroupCard
          key={group.groupCode}
          group={group}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
});

export default DepartmentGroupCardList;
