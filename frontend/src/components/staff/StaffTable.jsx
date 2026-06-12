import { memo } from 'react';
import { ADMIN_UI } from '../../constants/admin';
import StaffRow from './StaffRow';

const StaffTable = memo(function StaffTable({ items, onView, onEdit, onDelete, avatarOnly = false }) {
  if (!items.length) {
    return <div className="text-center py-16 text-content-muted">{ADMIN_UI.empty}</div>;
  }

  return (
    <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="table-header-row">
            <th className="table-th-left">{ADMIN_UI.staff.columns.code}</th>
            <th className="table-th-left">{ADMIN_UI.staff.columns.dept}</th>
            <th className="table-th-left">{ADMIN_UI.staff.columns.name}</th>
            <th className="table-th-left">{ADMIN_UI.staff.columns.rank}</th>
            <th className="table-th-left">{ADMIN_UI.staff.columns.position}</th>
            <th className="table-th-left">{ADMIN_UI.staff.columns.status}</th>
            <th className="table-th-right">{ADMIN_UI.staff.columns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((staff) => (
            <StaffRow
              key={staff.empCode}
              staff={staff}
              avatarOnly={avatarOnly}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
    </table>
  );
});

export default StaffTable;
