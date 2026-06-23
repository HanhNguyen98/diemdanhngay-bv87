import { memo } from 'react';
import { X } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';

/** Fixed map frame on mobile so every location preview uses the same dimensions. */
const MOBILE_MAP_FRAME_CLASS =
  'w-full aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm';

const DepartmentLocationMapModal = memo(function DepartmentLocationMapModal({ dept, onClose }) {
  if (!dept?.locationImageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-white rounded-xl shadow-panel w-full max-w-sm flex flex-col overflow-hidden animate-fade-in lg:max-w-4xl lg:h-[min(85vh,640px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-3 py-2.5 lg:px-4 lg:py-3 border-b border-gray-200 flex items-start justify-between gap-2 lg:gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-800 text-sm lg:text-base">
              {ADMIN_UI.departments.locationMapTitle}
            </h3>
            <p className="text-xs lg:text-sm text-content-muted mt-0.5 line-clamp-2 lg:truncate">
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
        <div className="shrink-0 p-2 lg:flex-1 lg:min-h-0 lg:p-4 lg:bg-surface-page/40 lg:flex lg:items-center lg:justify-center overflow-hidden">
          <div className={`${MOBILE_MAP_FRAME_CLASS} lg:max-w-full lg:max-h-full lg:w-auto lg:h-full lg:aspect-auto`}>
            <img
              src={dept.locationImageUrl}
              alt={`Sơ đồ vị trí ${dept.deptName}`}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default DepartmentLocationMapModal;
