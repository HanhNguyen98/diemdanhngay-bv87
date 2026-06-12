import { createContext, useContext } from 'react';
import { useHeadAiAssistant } from '../hooks/useHeadAiAssistant';

const HeadAiAssistantContext = createContext(null);

export function HeadAiAssistantProvider({ children, selectedDate, tableDisabled, onBatchComplete }) {
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
