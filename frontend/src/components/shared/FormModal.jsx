import { memo } from 'react';
import { X } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';

const FormModal = memo(function FormModal({
  title,
  children,
  onClose,
  onSubmit,
  loading,
  submitLabel,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-surface-white rounded-2xl shadow-panel w-full max-w-lg overflow-hidden animate-fade-in">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">{title}</h2>
          <button type="button" onClick={onClose} className="text-content-muted hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-3.5">
          {children}
          <div className="flex justify-end gap-2 pt-3 mt-1 border-t border-gray-200">
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
