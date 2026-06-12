import { createContext, useContext } from 'react';

const AdminDashboardContext = createContext(null);

export function AdminDashboardProvider({ value, children }) {
  return (
    <AdminDashboardContext.Provider value={value}>{children}</AdminDashboardContext.Provider>
  );
}

export function useAdminDashboardContext() {
  return useContext(AdminDashboardContext);
}
