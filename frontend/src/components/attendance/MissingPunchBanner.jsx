import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { UI } from '../../constants/attendance';

/**
 * SPEC §4.5.2 / P6-MissingBanner — missing check-out / unmarked queue banner.
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
    <aside
      role="status"
      aria-live="polite"
      className="flex w-full flex-col gap-1.5 rounded-lg border border-warning-border bg-warning px-3 py-2"
    >
      <div className="flex min-w-0 items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-fg" aria-hidden="true" />
        <div className="min-w-0 space-y-0.5">
          <p className="text-xs font-bold text-warning-text">
            {UI.missingPunchTitle}
            {parts.length > 0 ? ` — ${parts.join(' · ')}` : ` (${items.length})`}
          </p>
          <p className="text-3xs text-warning-text/90 truncate" title={`${preview}${more}`}>
            {preview}
            {more}
          </p>
          <p className="text-3xs text-warning-text/80">{UI.missingPunchHint}</p>
        </div>
      </div>
    </aside>
  );
});

export default MissingPunchBanner;
