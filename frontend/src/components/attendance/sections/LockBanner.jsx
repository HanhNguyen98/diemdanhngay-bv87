import { memo } from 'react';
import { DEFAULT_LOCK_MESSAGE, UI } from '../../../constants/attendance';
import { IconLock } from '../../icons/Icons';

const LockBanner = memo(function LockBanner({ lockMessage = DEFAULT_LOCK_MESSAGE }) {
  return (
    <aside
      role="status"
      aria-live="polite"
      className="flex w-full flex-col gap-1.5 rounded-lg border border-warning-border bg-warning px-3 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
    >
      <div className="flex min-w-0 items-center gap-2">
        <IconLock
          className="h-3.5 w-3.5 shrink-0 text-warning-text"
          aria-hidden="true"
        />
        <p className="text-xs leading-tight text-warning-text">
          <span className="font-bold">{UI.lockedBadge} — </span>
          <span className="font-normal">{lockMessage}</span>
        </p>
      </div>

      <span className="shrink-0 self-start rounded px-2 py-0.5 text-4xs font-semibold uppercase tracking-wide text-warning-text bg-warning-badge sm:self-center">
        {UI.readOnly}
      </span>
    </aside>
  );
});

export default LockBanner;
