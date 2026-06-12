import { memo } from 'react';
import { MapPin, Eye, Pencil, Trash2 } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import { getInitials } from '../../utils/formatters';
import AvatarStack from '../admin/sections/AvatarStack';
import { ActionBtn } from '../admin/sections/ActionButtons';

const DepartmentRow = memo(function DepartmentRow({ dept, onView, onEdit, onDelete, onViewLocation }) {
  const hasLocationMap = Boolean(dept.locationImageUrl);

  return (
    <tr className="border-b border-gray-100 hover:bg-surface-page/80 transition-colors">
      <td className="py-4 px-4 text-sm text-primary font-medium tabular-nums">
        {dept.deptCodeFormatted}
      </td>
      <td className="py-4 px-4">
        <p className="font-semibold text-gray-800">{dept.deptName}</p>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2 text-sm text-content-muted">
          <button
            type="button"
            onClick={() => hasLocationMap && onViewLocation(dept)}
            disabled={!hasLocationMap}
            title={
              hasLocationMap
                ? ADMIN_UI.departments.viewLocationMap
                : ADMIN_UI.departments.locationMapEmpty
            }
            className={`shrink-0 rounded-md p-1 transition-colors ${
              hasLocationMap
                ? 'text-primary hover:bg-primary-light cursor-pointer'
                : 'text-content-muted/40 cursor-not-allowed'
            }`}
            aria-label={
              hasLocationMap
                ? ADMIN_UI.departments.viewLocationMap
                : ADMIN_UI.departments.locationMapEmpty
            }
          >
            <MapPin className="w-4 h-4" />
          </button>
          <span>{dept.location || '—'}</span>
        </div>
      </td>
      <td className="py-4 px-4">
        {dept.headName ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full avatar-gradient text-white text-2xs font-bold flex items-center justify-center shrink-0">
              {getInitials(dept.headName)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{dept.headName}</p>
              <p className="text-2xs text-success-fg uppercase font-semibold tracking-wide">
                {dept.headRank || '—'}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-content-muted">—</span>
        )}
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center justify-center gap-3">
          <span className="font-semibold text-gray-800 tabular-nums">{dept.staffCount}</span>
          <AvatarStack count={dept.staffCount} />
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1.5 justify-end">
          <ActionBtn
            icon={Eye}
            onClick={() => onView(dept)}
            colorClass="text-primary hover:bg-primary-light"
            label="Xem"
          />
          <ActionBtn
            icon={Pencil}
            onClick={() => onEdit(dept)}
            colorClass="text-gray-600 hover:bg-neutral"
            label="Sửa"
          />
          <ActionBtn
            icon={Trash2}
            onClick={() => onDelete(dept)}
            colorClass="text-danger-fg hover:bg-danger"
            label="Xóa"
          />
        </div>
      </td>
    </tr>
  );
});

export default DepartmentRow;
