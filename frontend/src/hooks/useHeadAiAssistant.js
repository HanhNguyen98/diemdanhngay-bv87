import { useCallback, useRef, useState } from 'react';
import { HEAD_AI_ASSISTANT_UI } from '../constants/headAiAssistant';
import {
  confirmHeadBatchAttendance,
  executeHeadAiTool,
  executeHeadAiToolFallback,
  streamHeadAiChat,
} from '../services/headAiAssistantApi';

let messageId = 0;
function nextId() {
  messageId += 1;
  return messageId;
}

function createMessage(role, partial = {}) {
  return {
    id: nextId(),
    role,
    content: '',
    widgets: [],
    streaming: role === 'assistant',
    ...partial,
  };
}

export function useHeadAiAssistant({ selectedDate, tableDisabled, onBatchComplete } = {}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    createMessage('assistant', {
      content:
        'Chào Trưởng đơn vị, tôi có thể giúp bạn chấm công hàng loạt cho nhân viên chưa xác nhận.',
      streaming: false,
    }),
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  const appendToAssistant = useCallback((assistantId, updater) => {
    setMessages((prev) => prev.map((msg) => (msg.id === assistantId ? updater(msg) : msg)));
  }, []);

  const pushAssistantResult = useCallback((result) => {
    setMessages((prev) => [
      ...prev,
      createMessage('assistant', {
        content: result.message || '',
        widgets: result.widgets || [],
        streaming: false,
      }),
    ]);
  }, []);

  const send = useCallback(
    async ({ message = '', quickAction = null } = {}) => {
      if (tableDisabled) {
        setError(HEAD_AI_ASSISTANT_UI.disabledHint);
        return;
      }
      const trimmed = message.trim();
      if (!quickAction && !trimmed) return;
      if (loading) return;

      setError('');
      setLoading(true);

      if (trimmed) {
        setMessages((prev) => [...prev, createMessage('user', { content: trimmed, streaming: false })]);
      } else if (quickAction) {
        const label =
          HEAD_AI_ASSISTANT_UI.quickActions.find((a) => a.id === quickAction)?.label || '';
        setMessages((prev) => [...prev, createMessage('user', { content: label, streaming: false })]);
      }

      const assistantMsg = createMessage('assistant');
      setMessages((prev) => [...prev, assistantMsg]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamHeadAiChat(
          { message: trimmed, quickAction },
          {
            signal: controller.signal,
            onEvent: (event, data) => {
              if (event === 'token' && data?.text) {
                appendToAssistant(assistantMsg.id, (msg) => ({
                  ...msg,
                  content: msg.content + data.text,
                }));
              }
              if (event === 'widget' && data?.type) {
                appendToAssistant(assistantMsg.id, (msg) => ({
                  ...msg,
                  widgets: [...msg.widgets, data],
                }));
              }
              if (event === 'error') {
                setError(data?.message || HEAD_AI_ASSISTANT_UI.errorGeneric);
              }
            },
          },
        );
        appendToAssistant(assistantMsg.id, (msg) => ({ ...msg, streaming: false }));
      } catch (err) {
        if (err.name !== 'AbortError') {
          const fallbackParams =
            quickAction === 'batch_attendance'
              ? { date: selectedDate, scope: 'unchecked_only', status: 'DI_LAM' }
              : {};
          const fallback = quickAction
            ? await executeHeadAiToolFallback(quickAction, fallbackParams).catch(() => null)
            : null;
          if (fallback) {
            appendToAssistant(assistantMsg.id, (msg) => ({
              ...msg,
              content: fallback.message || msg.content,
              widgets: fallback.widgets || msg.widgets,
              streaming: false,
            }));
          } else {
            setError(err.message || HEAD_AI_ASSISTANT_UI.errorGeneric);
            appendToAssistant(assistantMsg.id, (msg) => ({
              ...msg,
              content: msg.content || 'Đã xảy ra lỗi khi xử lý yêu cầu.',
              streaming: false,
            }));
          }
        }
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [appendToAssistant, loading, selectedDate, tableDisabled],
  );

  const executeTool = useCallback(
    async (tool, params, { dismissMessageId, dismissWidgetIndex } = {}) => {
      if (tableDisabled) {
        setError(HEAD_AI_ASSISTANT_UI.disabledHint);
        return;
      }
      if (loading) return;
      setError('');
      setLoading(true);
      try {
        const mergedParams = { date: selectedDate, ...params };
        const result = await executeHeadAiTool(tool, mergedParams);
        if (dismissMessageId != null && dismissWidgetIndex != null) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== dismissMessageId) return msg;
              return {
                ...msg,
                widgets: msg.widgets.filter((_, idx) => idx !== dismissWidgetIndex),
              };
            }),
          );
        }
        pushAssistantResult(result);
      } catch (err) {
        setError(err.message || HEAD_AI_ASSISTANT_UI.errorGeneric);
      } finally {
        setLoading(false);
      }
    },
    [loading, pushAssistantResult, selectedDate, tableDisabled],
  );

  const dismissWidget = useCallback((messageId, widgetIndex) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        return {
          ...msg,
          widgets: msg.widgets.filter((_, idx) => idx !== widgetIndex),
        };
      }),
    );
  }, []);

  const confirmBatchAttendance = useCallback(
    async (messageId, widgetIndex, actionId) => {
      if (tableDisabled) {
        setError(HEAD_AI_ASSISTANT_UI.disabledHint);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const result = await confirmHeadBatchAttendance(actionId);
        dismissWidget(messageId, widgetIndex);
        setMessages((prev) => [
          ...prev,
          createMessage('assistant', {
            content: result.message || `Đã chấm công cho ${result.updated} nhân viên.`,
            streaming: false,
          }),
        ]);
        if (onBatchComplete) {
          await onBatchComplete();
        }
      } catch (err) {
        setError(err.message || HEAD_AI_ASSISTANT_UI.errorGeneric);
      } finally {
        setLoading(false);
      }
    },
    [dismissWidget, onBatchComplete, tableDisabled],
  );

  const handleSubmit = useCallback(
    (e) => {
      e?.preventDefault();
      const text = input;
      setInput('');
      send({ message: text });
    },
    [input, send],
  );

  const handleQuickAction = useCallback(
    (quickAction) => {
      send({ quickAction });
    },
    [send],
  );

  const toggleOpen = useCallback(() => {
    setOpen((v) => !v);
  }, []);

  return {
    open,
    setOpen,
    toggleOpen,
    messages,
    input,
    setInput,
    loading,
    error,
    setError,
    send,
    executeTool,
    handleSubmit,
    handleQuickAction,
    confirmBatchAttendance,
    dismissWidget,
    tableDisabled,
  };
}
