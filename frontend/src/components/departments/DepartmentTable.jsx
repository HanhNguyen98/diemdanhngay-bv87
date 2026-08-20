import { memo } from 'react';
import { ADMIN_UI } from '../../constants/admin';
import RegistryTableEmptyRow from '../admin/sections/RegistryTableEmptyRow';
import DepartmentRow from './DepartmentRow';

const DepartmentTable = memo(function DepartmentTable({
  items,
  showGroupColumn = false,
  onEdit,
  onDelete,
}) {
  const colSpan = showGroupColumn ? 7 : 6;

  return (
    <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="table-header-row">
            <th className="table-th-left max-lg:px-2 max-lg:py-1.5">{ADMIN_UI.departments.columns.code}</th>
            {showGroupColumn && (
              <th className="table-th-left max-lg:px-2 max-lg:py-1.5">{ADMIN_UI.departments.columns.group}</th>
            )}
            <th className="table-th-left max-lg:px-2 max-lg:py-1.5">{ADMIN_UI.departments.columns.unitCode}</th>
            <th className="table-th-left max-lg:px-2 max-lg:py-1.5">{ADMIN_UI.departments.columns.name}</th>
            <th className="table-th-left max-lg:px-2 max-lg:py-1.5">{ADMIN_UI.departments.columns.head}</th>
            <th className="table-th-center max-lg:px-2 max-lg:py-1.5 w-36">{ADMIN_UI.departments.columns.staff}</th>
            <th className="table-th-right max-lg:px-2 max-lg:py-1.5">{ADMIN_UI.departments.columns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <RegistryTableEmptyRow colSpan={colSpan} />
          ) : (
            items.map((dept) => (
              <DepartmentRow
                key={dept.deptCode}
                dept={dept}
                showGroupColumn={showGroupColumn}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </tbody>
    </table>
  );
});

export default DepartmentTable;
