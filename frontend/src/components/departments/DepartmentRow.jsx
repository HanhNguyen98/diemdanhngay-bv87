import { memo } from 'react';
import { MapPin, Pencil, Trash2 } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import { getInitials } from '../../utils/formatters';
import AvatarStack from '../admin/sections/AvatarStack';
import { ActionBtn } from '../admin/sections/ActionButtons';

const CELL_CLASS = 'py-2.5 px-2 align-top lg:py-4 lg:px-4';
const CLAMP_TEXT = 'line-clamp-2 leading-snug lg:line-clamp-none';
const { catalog: catalogUi } = ADMIN_UI;

const DepartmentRow = memo(function DepartmentRow({
  dept,
  showGroupColumn = false,
  onEdit,
  onDelete,
  onViewLocation,
}) {
  const hasLocationMap = Boolean(dept.locationImageUrl);
  const deleteBlocked = (dept.staffCount ?? 0) > 0;

  return (
    <tr className="border-b border-gray-100 hover:bg-surface-page/80 transition-colors">
      <td className={`${CELL_CLASS} text-sm text-primary font-medium tabular-nums whitespace-nowrap`}>
        {dept.deptCodeFormatted}
      </td>
      {showGroupColumn && (
        <td className={`${CELL_CLASS} text-xs lg:text-sm text-content-muted max-w-[5rem] sm:max-w-none`}>
          <span className={CLAMP_TEXT}>{dept.groupName || '—'}</span>
        </td>
      )}
      <td className={`${CELL_CLASS} text-sm text-content-body font-medium tabular-nums whitespace-nowrap`}>
        {dept.unitCode || '—'}
      </td>
      <td className={`${CELL_CLASS} max-w-[6.5rem] sm:max-w-none`}>
        <p className={`font-semibold text-gray-800 text-xs lg:text-sm ${CLAMP_TEXT}`}>{dept.deptName}</p>
      </td>
      <td className={CELL_CLASS}>
        <div className="flex items-start gap-1.5 text-xs lg:text-sm text-content-muted min-w-0 max-w-[5.5rem] sm:max-w-none">
          <button
            type="button"
            onClick={() => hasLocationMap && onViewLocation(dept)}
            disabled={!hasLocationMap}
            title={
              hasLocationMap
                ? ADMIN_UI.departments.viewLocationMap
                : ADMIN_UI.departments.locationMapEmpty
            }
            className={`shrink-0 rounded-md p-0.5 lg:p-1 transition-colors ${hasLocationMap
                ? 'text-primary hover:bg-primary-light cursor-pointer'
                : 'text-content-muted/40 cursor-not-allowed'
              }`}
            aria-label={
              hasLocationMap
                ? ADMIN_UI.departments.viewLocationMap
                : ADMIN_UI.departments.locationMapEmpty
            }
          >
            <MapPin className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          </button>
          <span className={`min-w-0 ${CLAMP_TEXT}`}>{dept.location || '—'}</span>
        </div>
      </td>
      <td className={`${CELL_CLASS} max-w-[7rem] sm:max-w-none`}>
        {dept.headName ? (
          <div className="flex items-start gap-1.5 min-w-0">
            <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full avatar-gradient text-white text-2xs font-bold flex items-center justify-center shrink-0">
              {getInitials(dept.headName)}
            </div>
            <p className={`min-w-0 flex-1 text-xs lg:text-sm leading-snug ${CLAMP_TEXT}`}>
              <span className="font-semibold text-gray-800">{dept.headName}</span>
              {dept.headRank && (
                <span className="text-2xs text-success-fg uppercase font-semibold tracking-wide">
                  <span className="max-lg:block lg:inline lg:ml-1">{dept.headRank}</span>
                </span>
              )}
            </p>
          </div>
        ) : (
          <span className="text-xs lg:text-sm text-content-muted">—</span>
        )}
      </td>
      <td className={`${CELL_CLASS} align-middle text-center`}>
        <div className="inline-flex items-center gap-2 lg:gap-3">
          <span className="w-8 text-right font-semibold text-gray-800 tabular-nums text-xs lg:text-sm shrink-0">
            {dept.staffCount}
          </span>
          <div className="w-[5.5rem] flex items-center justify-start shrink-0 min-h-7">
            {dept.staffCount > 0 ? <AvatarStack count={dept.staffCount} /> : null}
          </div>
        </div>
      </td>
      <td className={CELL_CLASS}>
        <div className="flex items-center gap-1 justify-end">
          <ActionBtn
            icon={Pencil}
            onClick={() => onEdit(dept)}
            colorClass="text-gray-600 hover:bg-neutral"
            label="Sửa"
          />
          <ActionBtn
            icon={Trash2}
            onClick={() => onDelete(dept)}
            disabled={deleteBlocked}
            title={deleteBlocked ? catalogUi.deleteBlockedDept(dept.staffCount) : 'Xóa'}
            colorClass="text-danger-fg hover:bg-danger"
            label="Xóa"
          />
        </div>
      </td>
    </tr>
  );
});

export default DepartmentRow;
