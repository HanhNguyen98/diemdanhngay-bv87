import { memo } from 'react';

const DepartmentViewModal = memo(function DepartmentViewModal({ dept, onClose }) {
  if (!dept) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-white rounded-xl p-6 max-w-md w-full shadow-panel animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-gray-800 mb-3">{dept.deptName}</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-content-muted">Mã</dt>
            <dd className="tabular-nums">{dept.deptCodeFormatted}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-content-muted">Vị trí</dt>
            <dd>{dept.location || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-content-muted">Trưởng ban</dt>
            <dd>{dept.headName || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-content-muted">Quân số</dt>
            <dd>{dept.staffCount}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
});

export default DepartmentViewModal;
