import { memo } from 'react';
import RefreshOverlay from './RefreshOverlay';

/**
 * Keeps children mounted during refetch; shows skeleton only on first load.
 */
const StableDataZone = memo(function StableDataZone({
  initialLoading = false,
  refreshing = false,
  skeleton = null,
  className = '',
  children,
}) {
  if (initialLoading && skeleton) {
    return skeleton;
  }

  return (
    <div className={`relative ${className}`.trim()}>
      {refreshing && <RefreshOverlay />}
      {children}
    </div>
  );
});

export default StableDataZone;
