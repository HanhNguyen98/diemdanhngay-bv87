import { useCallback, useRef, useState } from 'react';
import { AI_ASSISTANT_UI } from '../constants/aiAssistant';
import {
  confirmAiReminders,
  executeAiTool,
  executeAiToolFallback,
  streamAiChat,
} from '../services/aiAssistantApi';

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

export function useAiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    createMessage('assistant', {
      content:
        'Chào Admin, tôi có thể giúp thống kê Chấm công, xem ĐƠN VỊ thiếu dữ liệu chấm công và gửi nhắc nhở (mặc định ngày hôm qua). Dùng các nút gợi ý bên dưới nhé!',
      streaming: false,
    }),
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  const appendToAssistant = useCallback((assistantId, updater) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === assistantId ? updater(msg) : msg)),
    );
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
    async ({ message = '', quickAction = null, date = null } = {}) => {
      const trimmed = message.trim();
      if (!quickAction && !trimmed) return;
      if (loading) return;

      setError('');
      setLoading(true);

      if (trimmed) {
        setMessages((prev) => [...prev, createMessage('user', { content: trimmed, streaming: false })]);
      } else if (quickAction) {
        const label = AI_ASSISTANT_UI.quickActions.find((a) => a.id === quickAction)?.label || '';
        setMessages((prev) => [
          ...prev,
          createMessage('user', { content: label, streaming: false }),
        ]);
      }

      const assistantMsg = createMessage('assistant');
      setMessages((prev) => [...prev, assistantMsg]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamAiChat(
          { message: trimmed, quickAction, ...(date ? { date } : {}) },
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
                setError(data?.message || AI_ASSISTANT_UI.errorGeneric);
              }
            },
          },
        );
        appendToAssistant(assistantMsg.id, (msg) => ({ ...msg, streaming: false }));
      } catch (err) {
        if (err.name !== 'AbortError') {
          const fallback = quickAction ? await executeAiToolFallback(quickAction).catch(() => null) : null;
          if (fallback) {
            appendToAssistant(assistantMsg.id, (msg) => ({
              ...msg,
              content: fallback.message || msg.content,
              widgets: fallback.widgets || msg.widgets,
              streaming: false,
            }));
          } else {
            setError(err.message || AI_ASSISTANT_UI.errorGeneric);
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
    [appendToAssistant, loading],
  );

  const executeTool = useCallback(
    async (tool, params, { dismissMessageId, dismissWidgetIndex } = {}) => {
      if (loading) return;
      setError('');
      setLoading(true);
      try {
        const result = await executeAiTool(tool, params);
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
        setError(err.message || AI_ASSISTANT_UI.errorGeneric);
      } finally {
        setLoading(false);
      }
    },
    [loading, pushAssistantResult],
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

  const confirmReminders = useCallback(
    async (messageId, widgetIndex, actionId, deptCodes) => {
      setLoading(true);
      setError('');
      try {
        const result = await confirmAiReminders(actionId, deptCodes);
        dismissWidget(messageId, widgetIndex);
        setMessages((prev) => [
          ...prev,
          createMessage('assistant', {
            content: result.message || `Đã gửi nhắc nhở thành công đến ${result.sent} ĐƠN VỊ!`,
            streaming: false,
          }),
        ]);
      } catch (err) {
        setError(err.message || AI_ASSISTANT_UI.errorGeneric);
      } finally {
        setLoading(false);
      }
    },
    [dismissWidget],
  );

  const triggerBatchReminders = useCallback(
    (date) => {
      send({ quickAction: 'remind_missing_punch_depts', date: date || null });
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
    confirmReminders,
    dismissWidget,
    triggerBatchReminders,
  };
}
