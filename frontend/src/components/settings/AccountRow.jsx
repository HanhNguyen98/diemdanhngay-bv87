import { memo } from 'react';
import { KeyRound, Pencil, Trash2 } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import { ActionBtn } from '../admin/sections/ActionButtons';

const AccountRow = memo(function AccountRow({ account, onEdit, onDelete, onResetPassword }) {
  return (
    <tr className="border-b border-gray-100 hover:bg-surface-page/80 transition-colors">
      <td className="py-4 px-4 text-sm text-primary tabular-nums">{account.username}</td>
      <td className="py-4 px-4 text-sm text-content-muted tabular-nums">
        {account.empCodeFormatted || '—'}
      </td>
      <td className="py-4 px-4 text-sm font-semibold text-gray-800">{account.fullname}</td>
      <td className="py-4 px-4 text-sm text-content-muted">{account.roleLabel}</td>
      <td className="py-4 px-4 text-sm text-content-muted">
        {account.deptName ? `[${account.deptCodeFormatted}] ${account.deptName}` : '—'}
      </td>
      <td className="py-4 px-4">
        <span
          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
            account.active ? 'badge-success' : 'badge-neutral'
          }`}
        >
          {account.active ? ADMIN_UI.accounts.active : ADMIN_UI.accounts.inactive}
        </span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1.5 justify-end">
          <ActionBtn
            icon={KeyRound}
            onClick={() => onResetPassword(account)}
            colorClass="text-primary hover:bg-primary-light"
            label={ADMIN_UI.accounts.resetPasswordAction}
          />
          <ActionBtn
            icon={Pencil}
            onClick={() => onEdit(account)}
            colorClass="text-gray-600 hover:bg-neutral"
            label="Sửa"
          />
          <ActionBtn
            icon={Trash2}
            onClick={() => onDelete(account)}
            colorClass="text-danger-fg hover:bg-danger"
            label="Xóa"
          />
        </div>
      </td>
    </tr>
  );
});

export default AccountRow;
