import { memo } from 'react';
import { isPayrollFillPending, UI } from '../../../constants/attendance';

/**
 * Compact pending payroll-fill badge — SPEC P11b §4.13.6.
 * @param {object} [props]
 * @param {() => void} [props.onClick] Admin: open approve modal
 */
const NghiTrucRowNote = memo(function NghiTrucRowNote({ staff, onClick }) {
  if (staff == null || !isPayrollFillPending(staff)) {
    return null;
  }

  const className =
    'inline-flex max-w-full rounded-md bg-warning px-1 py-px text-4xs font-semibold leading-tight text-navy whitespace-nowrap truncate';

  if (onClick) {
    return (
      <button
        type="button"
        className={`${className} cursor-pointer hover:opacity-90`}
        title={UI.payrollFillPendingBadgeTitle}
        onClick={onClick}
      >
        {UI.payrollFillPendingBadge}
      </button>
    );
  }

  return (
    <span className={className} title={UI.payrollFillPendingBadgeTitle}>
      {UI.payrollFillPendingBadge}
    </span>
  );
});

export default NghiTrucRowNote;
