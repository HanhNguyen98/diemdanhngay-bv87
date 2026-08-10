import { createContext, useContext } from 'react';
import { useHeadAiAssistant } from '../hooks/useHeadAiAssistant';
import { useHeadAiSession } from './HeadAiSessionContext';

const HeadAiAssistantContext = createContext(null);

/** Global HEAD AI — reads date/lock from HeadAiSession (SPEC_HEAD §10). */
export function HeadAiAssistantProvider({ children }) {
  const { selectedDate, tableDisabled, onBatchComplete } = useHeadAiSession();
  const value = useHeadAiAssistant({ selectedDate, tableDisabled, onBatchComplete });
  return (
    <HeadAiAssistantContext.Provider value={value}>{children}</HeadAiAssistantContext.Provider>
  );
}

export function useHeadAiAssistantContext() {
  const ctx = useContext(HeadAiAssistantContext);
  if (!ctx) {
    throw new Error('useHeadAiAssistantContext must be used within HeadAiAssistantProvider');
  }
  return ctx;
}
