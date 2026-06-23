import { memo } from 'react';
import { ADMIN_UI } from '../../constants/admin';
import RegistryTableEmptyRow from '../admin/sections/RegistryTableEmptyRow';
import AccountRow from './AccountRow';

const COL_SPAN = 7;

const AccountTable = memo(function AccountTable({ items, onEdit, onDelete, onResetPassword }) {
  const { columns } = ADMIN_UI.accounts;

  return (
    <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="table-header-row">
            <th className="table-th-left">{columns.username}</th>
            <th className="table-th-left">{columns.empCode}</th>
            <th className="table-th-left">{columns.fullname}</th>
            <th className="table-th-left">{columns.role}</th>
            <th className="table-th-left">{columns.dept}</th>
            <th className="table-th-left">{columns.status}</th>
            <th className="table-th-right">{columns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <RegistryTableEmptyRow colSpan={COL_SPAN} />
          ) : (
            items.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                onEdit={onEdit}
                onDelete={onDelete}
                onResetPassword={onResetPassword}
              />
            ))
          )}
        </tbody>
    </table>
  );
});

export default AccountTable;
