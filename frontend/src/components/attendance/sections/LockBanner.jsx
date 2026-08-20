import { memo } from 'react';
import { DEFAULT_LOCK_MESSAGE, UI } from '../../../constants/attendance';
import { IconLock } from '../../icons/Icons';

const LockBanner = memo(function LockBanner({
  lockMessage = DEFAULT_LOCK_MESSAGE,
  badge = UI.lockedBadge,
  actionLabel,
  onAction,
  hideReadOnly = false,
}) {
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
          <span className="font-bold">{badge} — </span>
          <span className="font-normal">{lockMessage}</span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="rounded-lg border border-warning-border bg-surface-white px-2.5 py-1 text-3xs font-semibold text-navy hover:bg-neutral"
          >
            {actionLabel}
          </button>
        )}
        {!hideReadOnly && (
          <span className="rounded px-2 py-0.5 text-4xs font-semibold uppercase tracking-wide text-warning-text bg-warning-badge">
            {UI.readOnly}
          </span>
        )}
      </div>
    </aside>
  );
});

export default LockBanner;
