import { memo } from 'react';
import { X } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';

const SIZE_CLASS = {
  default: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  '2xl': 'sm:max-w-3xl',
  xl: 'sm:max-w-4xl',
};

const FormModal = memo(function FormModal({
  title,
  subtitle,
  children,
  onClose,
  onSubmit,
  loading,
  submitLabel,
  wide = false,
  size,
  centerMobile = false,
}) {
  const resolvedSize = size || (wide ? 'lg' : 'default');
  const isFitContentDesktop = resolvedSize === 'xl';
  const panelWidthClass = SIZE_CLASS[resolvedSize] || SIZE_CLASS.default;
  const panelHeightClass = isFitContentDesktop
    ? 'max-h-[92dvh] lg:max-h-none'
    : 'max-h-[92dvh] sm:max-h-[85vh]';
  const bodyScrollClass = isFitContentDesktop
    ? 'flex-1 min-h-0 overflow-x-hidden overflow-y-auto overscroll-y-contain lg:overflow-visible'
    : 'flex-1 min-h-0 overflow-x-hidden overflow-y-auto overscroll-y-contain';

  return (
    <div
      className={
        centerMobile
          ? 'fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-6'
          : 'fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4 py-0 sm:py-6'
      }
    >
      <div
        className={`bg-surface-white shadow-panel w-full max-w-full min-w-0 flex flex-col overflow-hidden animate-fade-in ${
          centerMobile ? 'rounded-2xl' : 'rounded-t-2xl sm:rounded-2xl'
        } ${panelWidthClass} ${panelHeightClass}`}
      >
        <div className="shrink-0 px-4 sm:px-5 py-3 border-b border-gray-200 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-navy">{title}</h2>
            {subtitle && (
              <p className="text-xs text-content-muted mt-0.5 leading-snug">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-content-muted hover:text-gray-800"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
          <div className={`${bodyScrollClass} px-4 sm:px-5 py-4 space-y-3.5`}>
            {children}
          </div>

          <div className="shrink-0 flex justify-end gap-2 px-4 sm:px-5 py-3 border-t border-gray-200 bg-surface-white pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-4 rounded-lg border border-gray-200 text-sm text-content-muted hover:bg-neutral"
            >
              {ADMIN_UI.form.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 rounded-lg btn-primary text-sm disabled:opacity-60"
            >
              {loading ? 'Đang lưu...' : submitLabel || ADMIN_UI.form.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default FormModal;
