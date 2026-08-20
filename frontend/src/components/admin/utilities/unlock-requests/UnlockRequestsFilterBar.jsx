import { memo } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { ADMIN_UI } from '../../../../constants/admin';

const LABEL_CLASS =
  'text-3xs font-semibold text-content-muted uppercase shrink-0 whitespace-nowrap';

const SELECT_CLASS =
  'appearance-none h-9 pl-9 pr-9 rounded-lg border border-line text-sm text-content-body bg-surface-white hover:bg-neutral outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-colors w-full';

const UnlockRequestsFilterBar = memo(function UnlockRequestsFilterBar({
  status,
  onStatusChange,
  disabled = false,
  className = '',
}) {
  const d = ADMIN_UI.dashboard;

  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      <span className={LABEL_CLASS}>{d.unlockRequestsFilterStatus}</span>
      <div className="relative w-[220px] max-w-full shrink-0">
        <Filter
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none"
          aria-hidden="true"
        />
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          disabled={disabled}
          aria-label={d.unlockRequestsFilterStatus}
          className={SELECT_CLASS}
        >
          <option value="PENDING">{d.unlockRequestsStatusPending}</option>
          <option value="APPROVED">{d.unlockRequestsStatusApproved}</option>
          <option value="REJECTED">{d.unlockRequestsStatusRejected}</option>
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none"
          aria-hidden="true"
        />
      </div>
    </div>
  );
});

export default UnlockRequestsFilterBar;
