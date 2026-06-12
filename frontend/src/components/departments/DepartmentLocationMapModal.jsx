import { memo } from 'react';
import { X } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';

const DepartmentLocationMapModal = memo(function DepartmentLocationMapModal({ dept, onClose }) {
  if (!dept?.locationImageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="bg-surface-white rounded-xl shadow-panel w-full max-w-4xl h-[min(85vh,640px)] flex flex-col overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-4 py-3 border-b border-gray-200 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-800">{ADMIN_UI.departments.locationMapTitle}</h3>
            <p className="text-sm text-content-muted mt-0.5 truncate">
              [{dept.deptCodeFormatted}] {dept.deptName}
              {dept.location ? ` · ${dept.location}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-content-muted hover:bg-neutral shrink-0"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0 p-4 bg-surface-page/40 flex items-center justify-center overflow-hidden">
          <img
            src={dept.locationImageUrl}
            alt={`Sơ đồ vị trí ${dept.deptName}`}
            className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg border border-gray-200 bg-white shadow-sm"
          />
        </div>
      </div>
    </div>
  );
});

export default DepartmentLocationMapModal;
