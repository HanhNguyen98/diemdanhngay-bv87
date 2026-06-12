import { memo } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';

const DeleteModal = memo(function DeleteModal({ title, message, onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-surface-white rounded-2xl shadow-panel w-full max-w-md overflow-hidden animate-fade-in">
        <div className="bg-danger px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-danger-fg">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="font-bold">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-danger-fg/70 hover:text-danger-fg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-content-body text-gray-700">{message}</p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg border border-line text-content-muted hover:bg-neutral"
            >
              {ADMIN_UI.form.cancel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg bg-danger-fg text-white font-medium hover:opacity-90 disabled:opacity-60"
            >
              {loading ? 'Đang xử lý...' : ADMIN_UI.form.confirmDelete}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default DeleteModal;
