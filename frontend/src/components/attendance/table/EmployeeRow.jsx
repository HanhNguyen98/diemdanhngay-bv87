import { memo } from 'react';
import { MANUAL_SCHEDULE_UI, SCAN_LOG_UI, UI, isMissingCheckout } from '../../../constants/attendance';
import { formatInstantHm } from '../../../utils/formatters';
import QuickActionGroup from './QuickActionGroup';
import StaffAvatar from './StaffAvatar';
import StatusBadge from './StatusBadge';

const EmployeeRow = memo(function EmployeeRow({
  staff,
  disabled,
  onQuickAction,
  onOpenScanLogs,
  onOpenManualSchedule,
}) {
  const missingOut = isMissingCheckout(staff);

  return (
    <tr className="transition-colors hover:bg-slate-50/60">
      <td className="py-3 px-4 align-middle">
        <div className="flex items-center gap-3 min-w-0">
          <StaffAvatar staff={staff} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{staff.fullname}</p>
            <p className="text-xs text-slate-400 truncate mt-0.5">ID: {staff.empCodeFormatted}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 align-middle text-sm text-slate-500">{staff.rankName || UI.emptyCell}</td>
      <td className="py-3 px-4 align-middle text-sm text-slate-500">
        {staff.positionName || UI.emptyCell}
      </td>
      <td className="py-3 px-4 align-middle text-sm tabular-nums text-navy font-medium">
        {formatInstantHm(staff.checkInAt) || UI.emptyCell}
      </td>
      <td className="py-3 px-4 align-middle text-sm tabular-nums text-navy font-medium">
        <div>
          {formatInstantHm(staff.checkOutAt) || UI.emptyCell}
          {missingOut ? (
            <p className="text-3xs font-medium text-warning-fg mt-0.5">{UI.missingCheckoutHint}</p>
          ) : null}
        </div>
      </td>
      <td className="py-3 px-4 align-middle">
        <StatusBadge staff={staff} />
      </td>
      <td className="py-3 px-4 align-middle text-right">
        <div className={`flex flex-col items-end gap-1.5 ${disabled ? 'table-actions-readonly' : ''}`}>
          <QuickActionGroup staff={staff} disabled={disabled} onQuickAction={onQuickAction} />
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
            <button
              type="button"
              className="text-primary font-semibold text-xs"
              onClick={() => onOpenManualSchedule?.(staff)}
            >
              {MANUAL_SCHEDULE_UI.openLink}
            </button>
            <button
              type="button"
              className="text-primary font-semibold text-xs"
              onClick={() => onOpenScanLogs?.(staff)}
            >
              {SCAN_LOG_UI.openLink}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
});

export default EmployeeRow;
