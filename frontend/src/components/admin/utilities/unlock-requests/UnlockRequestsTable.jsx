import { memo } from 'react';
import { ADMIN_UI } from '../../../../constants/admin';
import { formatDateDMY } from '../../../../utils/formatters';
import { formatLogDateTime } from '../../../../utils/reminderHistory';
import RegistryTableShell from '../../sections/RegistryTableShell';
import RegistryTableEmptyRow from '../../sections/RegistryTableEmptyRow';
import UnlockRequestsFilterBar from './UnlockRequestsFilterBar';
import UnlockRequestStatusBadge from './UnlockRequestStatusBadge';
import UnlockRequestActionsMenu from './UnlockRequestActionsMenu';

function deptLabel(row) {
  const code = row.deptCodeFormatted || '';
  const name = row.deptName || '';
  return [code, name].filter(Boolean).join(' ').trim() || '—';
}

const UnlockRequestsTable = memo(function UnlockRequestsTable({
  items,
  status,
  onStatusChange,
  initialLoading,
  refreshing = false,
  onApprove,
  onReject,
  className = '',
}) {
  const d = ADMIN_UI.dashboard;

  return (
    <RegistryTableShell
      className={className}
      title={d.unlockRequestsListTitle}
      toolbar={
        <UnlockRequestsFilterBar
          status={status}
          onStatusChange={onStatusChange}
          disabled={initialLoading}
        />
      }
      initialLoading={initialLoading}
      refreshing={refreshing}
      loadingLabel={ADMIN_UI.loading}
    >
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col style={{ width: '8rem' }} />
          <col style={{ width: '14rem' }} />
          <col style={{ width: '10.5rem' }} />
          <col />
          <col style={{ width: '8.5rem' }} />
          <col style={{ width: '10.5rem' }} />
          <col style={{ width: '8rem' }} />
        </colgroup>
        <thead className="sticky top-0 z-10">
          <tr className="table-header-row">
            <th className="table-th-left whitespace-nowrap">{d.unlockRequestsColDate}</th>
            <th className="table-th-left">{d.unlockRequestsColDept}</th>
            <th className="table-th-left whitespace-nowrap">{d.unlockRequestsColHead}</th>
            <th className="table-th-left">{d.unlockRequestsColReason}</th>
            <th className="table-th-left whitespace-nowrap">{d.unlockRequestsColStatus}</th>
            <th className="table-th-left whitespace-nowrap">{d.unlockRequestsColTime}</th>
            <th className="table-th-left whitespace-nowrap">{d.colActions}</th>
          </tr>
        </thead>
        <tbody>
          {!initialLoading && items.length === 0 ? (
            <RegistryTableEmptyRow colSpan={7} message={d.unlockRequestsEmpty} />
          ) : (
            items.map((row) => {
              const deptText = deptLabel(row);
              return (
                <tr
                  key={row.id}
                  className="border-b border-line/60 hover:bg-surface-page/50 transition-colors"
                >
                  <td className="py-3 px-4 tabular-nums whitespace-nowrap overflow-hidden">
                    {formatDateDMY(row.attendanceDate)}
                  </td>
                  <td className="py-3 px-4 admin-cell-name truncate overflow-hidden" title={deptText}>
                    {deptText}
                  </td>
                  <td
                    className="py-3 px-4 truncate overflow-hidden"
                    title={row.requestedBy || ''}
                  >
                    {row.requestedBy || '—'}
                  </td>
                  <td className="py-3 px-4 max-w-0 overflow-hidden">
                    <span className="block truncate" title={row.reason || ''}>
                      {row.reason || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 overflow-hidden">
                    <UnlockRequestStatusBadge status={row.status} title={row.statusLabel} />
                  </td>
                  <td className="py-3 px-4 text-xs tabular-nums text-content-muted whitespace-nowrap overflow-hidden">
                    {formatLogDateTime(row.requestedAt)}
                  </td>
                  <td className="py-3 px-4 overflow-hidden">
                    {row.status === 'PENDING' && (
                      <UnlockRequestActionsMenu
                        onApprove={() => onApprove(row)}
                        onReject={() => onReject(row)}
                      />
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </RegistryTableShell>
  );
});

export default UnlockRequestsTable;
