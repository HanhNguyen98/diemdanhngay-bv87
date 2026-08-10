import { useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { HEAD_AI_ASSISTANT_UI } from '../../../constants/headAiAssistant';
import { useHeadAiAssistantContext } from '../../../context/HeadAiAssistantContext';
import { useAppBranding } from '../../../context/AppBrandingContext';
import AppLogo from '../../shared/AppLogo';
import HeadFlowMessage from './HeadFlowMessage';
import DraggableAiFab from '../DraggableAiFab';
import { AI_FAB_STORAGE_KEYS, getHeadAiFabDefaultPosition } from '../../../utils/aiFabPosition';

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
      <DraggableAiFab
        storageKey={AI_FAB_STORAGE_KEYS.head}
        getDefaultPosition={getHeadAiFabDefaultPosition}
        onActivate={toggleOpen}
        ariaLabel={HEAD_AI_ASSISTANT_UI.title}
        title={HEAD_AI_ASSISTANT_UI.title}
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
      </DraggableAiFab>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(calc(100dvw-2rem),400px)] h-[min(75dvh,560px)] flex flex-col rounded-2xl shadow-2xl border border-line bg-surface-white overflow-hidden max-lg:bottom-20">
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

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-4 bg-surface-page space-y-4">
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

      <div className="shrink-0 border-t border-line bg-surface-white px-3 pt-2 pb-3">
        {error && (
          <div className="mb-2 text-xs text-danger-fg bg-danger/40 rounded-lg px-2.5 py-1.5 flex justify-between gap-2">
            <span className="min-w-0">{error}</span>
            <button type="button" onClick={() => setError('')} className="shrink-0 underline">
              Đóng
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-2">
          {HEAD_AI_ASSISTANT_UI.quickActions.map((action) => {
            const writeBlocked =
              tableDisabled && HEAD_AI_ASSISTANT_UI.writeActions.includes(action.id);
            return (
              <button
                key={action.id}
                type="button"
                disabled={loading || writeBlocked}
                title={writeBlocked ? HEAD_AI_ASSISTANT_UI.disabledHint : undefined}
                onClick={() => handleQuickAction(action.id)}
                className="h-7 px-2.5 rounded-full border border-line bg-surface-white text-2xs sm:text-xs text-primary font-medium hover:bg-primary-light hover:border-primary/30 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {action.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={HEAD_AI_ASSISTANT_UI.placeholder}
            disabled={loading}
            className="w-full h-10 rounded-xl border border-line pl-3 pr-11 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:bg-neutral"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary-light disabled:opacity-40"
            aria-label={HEAD_AI_ASSISTANT_UI.sendLabel}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
