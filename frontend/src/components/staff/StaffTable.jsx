import { memo } from 'react';
import { ADMIN_UI } from '../../constants/admin';
import RegistryTableEmptyRow from '../admin/sections/RegistryTableEmptyRow';
import StaffRow from './StaffRow';

const StaffTable = memo(function StaffTable({
  items,
  onEdit,
  onDelete,
  onHistory,
  onDeleteFingerprint,
  avatarOnly = false,
  hideDeptColumn = false,
}) {
  const colSpan = hideDeptColumn ? 7 : 8;

  return (
    <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="table-header-row">
            <th className="table-th-left">{ADMIN_UI.staff.columns.code}</th>
            {!hideDeptColumn && (
              <th className="table-th-left">{ADMIN_UI.staff.columns.dept}</th>
            )}
            <th className="table-th-left">{ADMIN_UI.staff.columns.name}</th>
            <th className="table-th-left">{ADMIN_UI.staff.columns.rank}</th>
            <th className="table-th-left">{ADMIN_UI.staff.columns.position}</th>
            <th className="table-th-left">{ADMIN_UI.staff.columns.status}</th>
            <th className="table-th-left">{ADMIN_UI.staff.columns.fingerprint}</th>
            <th className="table-th-right">{ADMIN_UI.staff.columns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <RegistryTableEmptyRow colSpan={colSpan} />
          ) : (
            items.map((staff) => (
              <StaffRow
                key={staff.empCode}
                staff={staff}
                avatarOnly={avatarOnly}
                hideDeptColumn={hideDeptColumn}
                onEdit={onEdit}
                onDelete={onDelete}
                onHistory={onHistory}
                onDeleteFingerprint={onDeleteFingerprint}
              />
            ))
          )}
        </tbody>
    </table>
  );
});

export default StaffTable;
