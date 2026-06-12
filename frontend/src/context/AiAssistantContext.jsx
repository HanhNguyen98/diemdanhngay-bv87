import { createContext, useContext } from 'react';
import { useAiAssistant } from '../hooks/useAiAssistant';

const AiAssistantContext = createContext(null);

export function AiAssistantProvider({ children }) {
  const value = useAiAssistant();
  return <AiAssistantContext.Provider value={value}>{children}</AiAssistantContext.Provider>;
}

export function useAiAssistantContext() {
  const ctx = useContext(AiAssistantContext);
  if (!ctx) {
    throw new Error('useAiAssistantContext must be used within AiAssistantProvider');
  }
  return ctx;
}
