import { useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { HEAD_AI_ASSISTANT_UI } from '../../../constants/headAiAssistant';
import { useHeadAiAssistantContext } from '../../../context/HeadAiAssistantContext';
import { useAppBranding } from '../../../context/AppBrandingContext';
import AppLogo from '../../shared/AppLogo';
import HeadFlowMessage from './HeadFlowMessage';

const AI_LOGO_CLASS = 'w-full h-full rounded-full object-cover';
const AI_LOGO_FALLBACK_CLASS =
  'w-full h-full rounded-full bg-white/15 flex items-center justify-center text-white';
const AI_LOGO_ICON_CLASS = 'w-4 h-4';

export default function HeadFlowPanel() {
  const {
    open,
    setOpen,
    toggleOpen,
    messages,
    input,
    setInput,
    loading,
    error,
    setError,
    handleSubmit,
    handleQuickAction,
    confirmBatchAttendance,
    dismissWidget,
    executeTool,
    tableDisabled,
  } = useHeadAiAssistantContext();
  const { branding } = useAppBranding();

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={toggleOpen}
        disabled={tableDisabled}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 h-11 px-4 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed max-lg:bottom-24"
        aria-label={HEAD_AI_ASSISTANT_UI.title}
        title={tableDisabled ? HEAD_AI_ASSISTANT_UI.disabledHint : HEAD_AI_ASSISTANT_UI.title}
      >
        <span className="w-6 h-6 shrink-0 overflow-hidden rounded-full ring-1 ring-white/30">
          <AppLogo
            logoUrl={branding.logoUrl}
            className={AI_LOGO_CLASS}
            fallbackClassName={AI_LOGO_FALLBACK_CLASS}
            iconClassName={AI_LOGO_ICON_CLASS}
          />
        </span>
        <span className="text-sm font-semibold hidden sm:inline">Trợ lý AI</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(100vw-2rem,400px)] h-[min(75vh,560px)] flex flex-col rounded-2xl shadow-2xl border border-gray-200 bg-white overflow-hidden max-lg:bottom-20">
      <header className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 bg-primary text-white">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 shrink-0 overflow-hidden rounded-full ring-1 ring-white/25">
            <AppLogo
              logoUrl={branding.logoUrl}
              className={AI_LOGO_CLASS}
              fallbackClassName={AI_LOGO_FALLBACK_CLASS}
              iconClassName={AI_LOGO_ICON_CLASS}
            />
          </div>
          <h2 className="text-sm font-bold truncate">{HEAD_AI_ASSISTANT_UI.title}</h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center shrink-0"
          aria-label={HEAD_AI_ASSISTANT_UI.closeLabel}
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-4 bg-slate-50 space-y-4">
        {messages.map((message) => (
          <HeadFlowMessage
            key={message.id}
            message={message}
            loading={loading}
            onConfirmBatch={confirmBatchAttendance}
            onDismissWidget={dismissWidget}
            onExecuteTool={executeTool}
          />
        ))}
        {loading && (
          <p className="text-xs text-content-muted text-center animate-pulse">
            {HEAD_AI_ASSISTANT_UI.thinking}
          </p>
        )}
      </div>

      <div className="shrink-0 border-t border-gray-200 bg-white px-3 pt-2 pb-3">
        {error && (
          <div className="mb-2 text-xs text-danger-fg bg-danger/40 rounded-lg px-2.5 py-1.5 flex justify-between gap-2">
            <span className="min-w-0">{error}</span>
            <button type="button" onClick={() => setError('')} className="shrink-0 underline">
              Đóng
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-2">
          {HEAD_AI_ASSISTANT_UI.quickActions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={loading || tableDisabled}
              onClick={() => handleQuickAction(action.id)}
              className="h-7 px-2.5 rounded-full border border-gray-200 bg-white text-2xs sm:text-xs text-primary font-medium hover:bg-blue-50 hover:border-blue-200 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {action.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={HEAD_AI_ASSISTANT_UI.placeholder}
            disabled={loading || tableDisabled}
            className="w-full h-10 rounded-xl border border-gray-200 pl-3 pr-11 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={loading || tableDisabled || !input.trim()}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-primary hover:bg-blue-50 disabled:opacity-40"
            aria-label={HEAD_AI_ASSISTANT_UI.sendLabel}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
