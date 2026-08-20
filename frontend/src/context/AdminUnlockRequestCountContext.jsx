import { createContext, useContext } from 'react';
import { useUnlockRequestPendingCount } from '../hooks/useUnlockRequestPendingCount';

const AdminUnlockRequestCountContext = createContext({
  pendingCount: 0,
  refreshPendingCount: () => {},
});

export function AdminUnlockRequestCountProvider({ children }) {
  const value = useUnlockRequestPendingCount({ enabled: true });
  return (
    <AdminUnlockRequestCountContext.Provider value={value}>
      {children}
    </AdminUnlockRequestCountContext.Provider>
  );
}

export function useAdminUnlockRequestCount() {
  return useContext(AdminUnlockRequestCountContext);
}
