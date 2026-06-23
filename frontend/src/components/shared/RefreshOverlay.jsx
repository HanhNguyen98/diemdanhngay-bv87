import { memo } from 'react';

/** Semi-transparent overlay while refetching — keeps underlying rows/cards mounted. */
const RefreshOverlay = memo(function RefreshOverlay() {
  return (
    <div
      className="absolute inset-0 z-10 bg-surface-white/40 pointer-events-none"
      aria-hidden="true"
    />
  );
});

export default RefreshOverlay;
