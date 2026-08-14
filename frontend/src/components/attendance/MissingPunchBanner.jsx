import { memo } from 'react';
import { UI } from '../../constants/attendance';

/**
 * SPEC §4.5.2 — missing check-out / unmarked queue banner (Vietnamese UI only).
 */
const MissingPunchBanner = memo(function MissingPunchBanner({ items, loading }) {
  if (loading || !items?.length) {
    return null;
  }
  const missingOut = items.filter(
    (i) => i.reason === 'INCOMPLETE_PUNCHES' || i.reason === 'MISSING_CHECK_OUT',
  ).length;
  const earlyLeave = items.filter((i) => i.reason === 'MISSING_EARLY_LEAVE_REASON').length;
  const unmarked = items.filter((i) => i.reason === 'UNMARKED').length;
  const preview = items
    .slice(0, 5)
    .map((i) => i.fullName || i.empCodeFormatted)
    .join(', ');
  const more = items.length > 5 ? ` (+${items.length - 5})` : '';

  const parts = [];
  if (missingOut > 0) {
    parts.push(`${missingOut} ${UI.missingPunchIncomplete.toLowerCase()}`);
  }
  if (earlyLeave > 0) {
    parts.push(`${earlyLeave} ${UI.missingPunchEarlyLeave.toLowerCase()}`);
  }
  if (unmarked > 0) {
    parts.push(`${unmarked} ${UI.missingPunchUnmarked.toLowerCase()}`);
  }

  return (
    <div className="rounded-xl border border-warning-fg/30 bg-warning px-3 py-2.5 space-y-1">
      <p className="text-sm font-semibold text-navy">{UI.missingPunchTitle}</p>
      <p className="text-xs text-content-muted">
        {parts.join(' · ')}
        {preview ? ` — ${preview}${more}` : ''}
      </p>
      <p className="text-xs text-content-muted">{UI.missingPunchHint}</p>
    </div>
  );
});

export default MissingPunchBanner;
