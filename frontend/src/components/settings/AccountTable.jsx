import { memo } from 'react';
import { ADMIN_UI } from '../../constants/admin';
import AccountRow from './AccountRow';

const AccountTable = memo(function AccountTable({ items, onEdit, onDelete, onResetPassword }) {
  if (!items.length) {
    return <div className="text-center py-16 text-content-muted">{ADMIN_UI.empty}</div>;
  }

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
          {items.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              onEdit={onEdit}
              onDelete={onDelete}
              onResetPassword={onResetPassword}
            />
          ))}
        </tbody>
    </table>
  );
});

export default AccountTable;
