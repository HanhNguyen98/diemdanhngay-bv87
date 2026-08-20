import { memo } from 'react';
import NghiTrucRowNote from './NghiTrucRowNote';
import StatusBadge from './StatusBadge';

/**
 * Status badge + nghỉ trực pending line — SPEC §4.13.6 P11.
 * @param {object} [props]
 * @param {() => void} [props.onPendingClick] Admin: badge click opens approve modal
 */
const StatusCell = memo(function StatusCell({ staff, variant, onPendingClick }) {
  return (
    <div className="min-w-0 flex max-w-full flex-col items-start gap-0.5">
      <StatusBadge staff={staff} variant={variant} compactNghiTruc />
      <NghiTrucRowNote staff={staff} onClick={onPendingClick} />
    </div>
  );
});

export default StatusCell;
