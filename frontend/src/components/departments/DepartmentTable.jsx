import { memo } from 'react';
import { ADMIN_UI } from '../../constants/admin';
import DepartmentRow from './DepartmentRow';

const DepartmentTable = memo(function DepartmentTable({
  items,
  onView,
  onEdit,
  onDelete,
  onViewLocation,
}) {
  if (!items.length) {
    return <div className="text-center py-16 text-content-muted">{ADMIN_UI.empty}</div>;
  }

  return (
    <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="table-header-row">
            <th className="table-th-left">{ADMIN_UI.departments.columns.code}</th>
            <th className="table-th-left">{ADMIN_UI.departments.columns.name}</th>
            <th className="table-th-left">{ADMIN_UI.departments.columns.location}</th>
            <th className="table-th-left">{ADMIN_UI.departments.columns.head}</th>
            <th className="table-th-center">{ADMIN_UI.departments.columns.staff}</th>
            <th className="table-th-right">{ADMIN_UI.departments.columns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((dept) => (
            <DepartmentRow
              key={dept.deptCode}
              dept={dept}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewLocation={onViewLocation}
            />
          ))}
        </tbody>
    </table>
  );
});

export default DepartmentTable;
