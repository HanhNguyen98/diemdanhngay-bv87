import { memo } from 'react';
import { ADMIN_UI } from '../../../../constants/admin';

const STATUS_META = {
  PENDING: { className: 'badge-warning', labelKey: 'unlockRequestsStatusPending' },
  APPROVED: { className: 'badge-success', labelKey: 'unlockRequestsStatusApproved' },
  REJECTED: { className: 'badge-danger', labelKey: 'unlockRequestsStatusRejected' },
};

const UnlockRequestStatusBadge = memo(function UnlockRequestStatusBadge({ status, title }) {
  const meta = STATUS_META[status] || STATUS_META.PENDING;
  const label = ADMIN_UI.dashboard[meta.labelKey];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-3xs font-semibold whitespace-nowrap ${meta.className}`}
      title={title || label}
    >
      {label}
    </span>
  );
});

export default UnlockRequestStatusBadge;
