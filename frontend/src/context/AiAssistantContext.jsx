import { createContext, useContext, useMemo } from 'react';
import { useAiAssistant } from '../hooks/useAiAssistant';

const AiAssistantActionsContext = createContext(null);
const AiAssistantStateContext = createContext(null);

export function AiAssistantProvider({ children }) {
  const assistant = useAiAssistant();

  const actions = useMemo(
    () => ({
      setOpen: assistant.setOpen,
      toggleOpen: assistant.toggleOpen,
      setInput: assistant.setInput,
      setError: assistant.setError,
      send: assistant.send,
      executeTool: assistant.executeTool,
      handleSubmit: assistant.handleSubmit,
      handleQuickAction: assistant.handleQuickAction,
      confirmReminders: assistant.confirmReminders,
      dismissWidget: assistant.dismissWidget,
      triggerBatchReminders: assistant.triggerBatchReminders,
    }),
    [
      assistant.setOpen,
      assistant.toggleOpen,
      assistant.setInput,
      assistant.setError,
      assistant.send,
      assistant.executeTool,
      assistant.handleSubmit,
      assistant.handleQuickAction,
      assistant.confirmReminders,
      assistant.dismissWidget,
      assistant.triggerBatchReminders,
    ],
  );

  const state = useMemo(
    () => ({
      open: assistant.open,
      messages: assistant.messages,
      input: assistant.input,
      loading: assistant.loading,
      error: assistant.error,
    }),
    [
      assistant.open,
      assistant.messages,
      assistant.input,
      assistant.loading,
      assistant.error,
    ],
  );

  return (
    <AiAssistantActionsContext.Provider value={actions}>
      <AiAssistantStateContext.Provider value={state}>{children}</AiAssistantStateContext.Provider>
    </AiAssistantActionsContext.Provider>
  );
}

/** Stable actions only — sidebar/menu không re-render khi AI stream token. */
export function useAiAssistantActions() {
  const ctx = useContext(AiAssistantActionsContext);
  if (!ctx) {
    throw new Error('useAiAssistantActions must be used within AiAssistantProvider');
  }
  return ctx;
}

/** Full AI state + actions — dùng cho ClinicalFlowPanel. */
export function useAiAssistantContext() {
  const actions = useAiAssistantActions();
  const state = useContext(AiAssistantStateContext);
  if (!state) {
    throw new Error('useAiAssistantContext must be used within AiAssistantProvider');
  }
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}
