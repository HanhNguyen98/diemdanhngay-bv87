import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { todayISO } from '../utils/formatters';

/**
 * Bridges attendance page state into the global HEAD AI FAB (SPEC_HEAD §10).
 * Off attendance: today + write blocked; on attendance: live date / soft-lock / refresh.
 */
const HeadAiSessionContext = createContext(null);

export function HeadAiSessionProvider({ children }) {
  const [selectedDate, setSelectedDate] = useState(() => todayISO());
  const [tableDisabled, setTableDisabled] = useState(true);
  const onBatchCompleteRef = useRef(null);
  const [, bump] = useState(0);

  const registerAttendanceSession = useCallback(
    ({ selectedDate: date, tableDisabled: disabled, onBatchComplete }) => {
      setSelectedDate(date || todayISO());
      setTableDisabled(Boolean(disabled));
      onBatchCompleteRef.current = typeof onBatchComplete === 'function' ? onBatchComplete : null;
      bump((n) => n + 1);

      return () => {
        setSelectedDate(todayISO());
        setTableDisabled(true);
        onBatchCompleteRef.current = null;
        bump((n) => n + 1);
      };
    },
    [],
  );

  const runBatchComplete = useCallback(async () => {
    if (onBatchCompleteRef.current) {
      await onBatchCompleteRef.current();
    }
  }, []);

  const value = useMemo(
    () => ({
      selectedDate,
      tableDisabled,
      registerAttendanceSession,
      onBatchComplete: runBatchComplete,
    }),
    [selectedDate, tableDisabled, registerAttendanceSession, runBatchComplete],
  );

  return (
    <HeadAiSessionContext.Provider value={value}>{children}</HeadAiSessionContext.Provider>
  );
}

export function useHeadAiSession() {
  const ctx = useContext(HeadAiSessionContext);
  if (!ctx) {
    throw new Error('useHeadAiSession must be used within HeadAiSessionProvider');
  }
  return ctx;
}
