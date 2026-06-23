import { createContext, useContext } from 'react';
import { useAttendanceStatusCatalog } from '../hooks/useAttendanceStatusCatalog';
import { getDefaultStatusConfig } from '../utils/statusCatalog';

const AttendanceStatusContext = createContext(null);

export function AttendanceStatusProvider({ children }) {
  const value = useAttendanceStatusCatalog();
  return (
    <AttendanceStatusContext.Provider value={value}>{children}</AttendanceStatusContext.Provider>
  );
}

export function useAttendanceStatusConfig() {
  const ctx = useContext(AttendanceStatusContext);
  if (ctx) {
    return ctx;
  }
  return { ...getDefaultStatusConfig(), items: [], loading: false, error: '' };
}
