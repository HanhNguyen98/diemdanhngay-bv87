import { memo } from 'react';

const StaffViewModal = memo(function StaffViewModal({ staff, onClose }) {
  if (!staff) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-white rounded-xl p-6 max-w-md w-full shadow-panel animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-gray-800 mb-3">{staff.fullname}</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-content-muted">Mã</dt>
            <dd className="tabular-nums">{staff.empCodeFormatted}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-content-muted">Đơn vị</dt>
            <dd>
              [{staff.deptCodeFormatted}] {staff.deptName}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-content-muted">Cấp bậc</dt>
            <dd>{staff.rankName || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-content-muted">Chức vụ</dt>
            <dd>{staff.positionName || '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
});

export default StaffViewModal;
