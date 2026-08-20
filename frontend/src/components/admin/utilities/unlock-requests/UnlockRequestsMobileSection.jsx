import { memo } from 'react';
import { ADMIN_UI } from '../../../../constants/admin';
import { formatDateDMY } from '../../../../utils/formatters';
import { formatLogDateTime } from '../../../../utils/reminderHistory';
import UnlockRequestsFilterBar from './UnlockRequestsFilterBar';
import UnlockRequestStatusBadge from './UnlockRequestStatusBadge';
import UnlockRequestActionsMenu from './UnlockRequestActionsMenu';

const LIST_SHELL =
  'bg-surface-white border border-line rounded-xl shadow-card overflow-hidden';

function deptLabel(row) {
  const code = row.deptCodeFormatted || '';
  const name = row.deptName || '';
  return [code, name].filter(Boolean).join(' ').trim() || '—';
}

const UnlockRequestsMobileSection = memo(function UnlockRequestsMobileSection({
  items,
  status,
  onStatusChange,
  initialLoading,
  refreshing = false,
  onApprove,
  onReject,
}) {
  const d = ADMIN_UI.dashboard;

  return (
    <div className="lg:hidden flex flex-col gap-2 min-w-0 max-w-full">
      <section className={LIST_SHELL}>
        <div className="px-3 py-2.5 border-b border-line flex flex-col gap-2">
          <h3 className="admin-section-title text-xs uppercase">{d.unlockRequestsListTitle}</h3>
          <UnlockRequestsFilterBar
            status={status}
            onStatusChange={onStatusChange}
            disabled={initialLoading}
            className="w-full flex-wrap sm:flex-nowrap"
          />
        </div>

        <div className={`relative ${refreshing ? 'opacity-70' : ''}`}>
          {initialLoading ? (
            <div className="p-4 text-sm text-content-muted animate-pulse">{ADMIN_UI.loading}</div>
          ) : !items.length ? (
            <p className="px-3 py-6 text-sm text-content-muted text-center">{d.unlockRequestsEmpty}</p>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((row) => {
                const deptText = deptLabel(row);
                return (
                  <li key={row.id} className="px-3 py-3 space-y-2">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <p className="text-sm font-semibold text-navy tabular-nums shrink-0">
                        {formatDateDMY(row.attendanceDate)}
                      </p>
                      <UnlockRequestStatusBadge status={row.status} title={row.statusLabel} />
                    </div>
                    <p className="text-sm admin-cell-name truncate" title={deptText}>
                      {deptText}
                    </p>
                    <p className="text-xs text-content-muted truncate" title={row.requestedBy}>
                      {d.unlockRequestsColHead}: {row.requestedBy || '—'}
                    </p>
                    <p className="text-xs text-content-body line-clamp-2" title={row.reason}>
                      {row.reason || '—'}
                    </p>
                    <p className="text-2xs text-content-muted tabular-nums">
                      {formatLogDateTime(row.requestedAt)}
                    </p>
                    {row.status === 'PENDING' && (
                      <div className="pt-1">
                        <UnlockRequestActionsMenu
                          onApprove={() => onApprove(row)}
                          onReject={() => onReject(row)}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
});

export default UnlockRequestsMobileSection;
