import { memo } from 'react';
import { Eye, Image, Pencil, Trash2 } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import { getInitials } from '../../utils/formatters';
import { ActionBtn } from '../admin/sections/ActionButtons';

const StaffRow = memo(function StaffRow({ staff, onView, onEdit, onDelete, avatarOnly = false }) {
  return (
    <tr className="border-b border-gray-100 hover:bg-surface-page/80 transition-colors">
      <td className="py-4 px-4 text-sm text-primary font-medium tabular-nums">
        {staff.empCodeFormatted}
      </td>
      <td className="py-4 px-4 text-sm text-content-muted">
        <span className="text-xs text-primary tabular-nums mr-1">[{staff.deptCodeFormatted}]</span>
        {staff.deptName}
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          {staff.avatarUrl ? (
            <img
              src={staff.avatarUrl}
              alt=""
              className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-gray-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-full avatar-gradient text-white text-xs font-bold flex items-center justify-center shrink-0">
              {getInitials(staff.fullname)}
            </div>
          )}
          <span className="font-semibold text-gray-800">{staff.fullname}</span>
        </div>
      </td>
      <td className="py-4 px-4 text-sm text-content-muted">
        {staff.rankName || '—'}
      </td>
      <td className="py-4 px-4 text-sm text-content-muted">
        {staff.positionName || '—'}
      </td>
   
      <td className="py-4 px-4">
        <span
          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
            staff.active ? 'badge-success' : 'badge-neutral'
          }`}
        >
          {staff.active ? ADMIN_UI.staff.active : ADMIN_UI.staff.inactive}
        </span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1.5 justify-end">
          <ActionBtn
            icon={Eye}
            onClick={() => onView(staff)}
            colorClass="text-primary hover:bg-primary-light"
            label="Xem"
          />
          <ActionBtn
            icon={avatarOnly ? Image : Pencil}
            onClick={() => onEdit(staff)}
            colorClass={
              avatarOnly ? 'text-primary hover:bg-primary-light' : 'text-gray-600 hover:bg-neutral'
            }
            label={avatarOnly ? 'Ảnh đại diện' : 'Sửa'}
          />
          {!avatarOnly && onDelete && (
            <ActionBtn
              icon={Trash2}
              onClick={() => onDelete(staff)}
              colorClass="text-danger-fg hover:bg-danger"
              label="Xóa"
            />
          )}
        </div>
      </td>
    </tr>
  );
});

export default StaffRow;
