import { memo } from 'react';
import { UI } from '../../../constants/attendance';
import QuickActionGroup from './QuickActionGroup';
import StaffAvatar from './StaffAvatar';
import StatusBadge from './StatusBadge';

const EmployeeRow = memo(function EmployeeRow({ staff, disabled, onQuickAction }) {
  return (
    <tr className="transition-colors hover:bg-slate-50/60">
      <td className="py-3 px-4 align-middle">
        <div className="flex items-center gap-3 min-w-0">
          <StaffAvatar staff={staff} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{staff.fullname}</p>
            <p className="text-xs text-slate-400 truncate mt-0.5">
            ID: {staff.empCodeFormatted}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 align-middle text-sm text-slate-500">
        {staff.rankName || UI.emptyCell}
      </td>
      <td className="py-3 px-4 align-middle text-sm text-slate-500">
        {staff.positionName || UI.emptyCell}
      </td>
      <td className="py-3 px-4 align-middle">
        <StatusBadge staff={staff} />
      </td>
      <td className="py-3 px-4 align-middle text-right">
        <div className={disabled ? 'table-actions-readonly' : undefined}>
          <QuickActionGroup staff={staff} disabled={disabled} onQuickAction={onQuickAction} />
        </div>
      </td>
    </tr>
  );
});

export default EmployeeRow;
