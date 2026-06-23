import { memo } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';

const VARIANTS = {
  success: {
    box: 'bg-success border-success-fg/30 text-gray-800',
    iconClass: 'text-success-fg',
    Icon: CheckCircle2,
  },
  warning: {
    box: 'bg-warning border-warning-fg/30 text-gray-800',
    iconClass: 'text-warning-fg',
    Icon: AlertTriangle,
  },
  error: {
    box: 'bg-danger border-danger-fg/30 text-gray-800',
    iconClass: 'text-danger-fg',
    Icon: AlertCircle,
  },
};

/**
 * Toast cố định — mobile: giữa màn dưới top bar; desktop: góc phải trên.
 * @param {{ flash: { type: string, message: string }, onClose: () => void }} props
 */
const FlashBanner = memo(function FlashBanner({ flash, onClose }) {
  if (!flash) return null;

  const variant = VARIANTS[flash.type] ?? VARIANTS.error;
  const { box, iconClass, Icon } = variant;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed z-[70] animate-fade-in border ${box} flex items-start
        max-lg:top-14 max-lg:left-1/2 max-lg:-translate-x-1/2 max-lg:w-[min(calc(100dvw-1.5rem),28rem)] max-lg:max-w-md
        max-lg:rounded-lg max-lg:px-3 max-lg:py-2 max-lg:text-xs max-lg:gap-2 max-lg:shadow-md
        lg:top-4 lg:right-4 lg:w-[min(calc(100dvw-2rem),22rem)] lg:rounded-xl lg:px-3 lg:py-2.5 lg:text-sm lg:gap-2.5 lg:shadow-panel lg:items-center`}
    >
      <Icon className={`shrink-0 mt-0.5 max-lg:w-4 max-lg:h-4 lg:w-4 lg:h-4 lg:mt-0 ${iconClass}`} />
      <span className="flex-1 min-w-0 leading-snug break-words">{flash.message}</span>
      <button
        type="button"
        onClick={onClose}
        className="text-content-muted hover:text-gray-800 shrink-0 rounded-md hover:bg-white/60 transition-colors max-lg:p-0 lg:p-0.5"
        aria-label="Đóng"
      >
        <X className="max-lg:w-3.5 max-lg:h-3.5 lg:w-4 lg:h-4" />
      </button>
    </div>
  );
});

export default FlashBanner;
