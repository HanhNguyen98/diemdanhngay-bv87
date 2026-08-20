import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
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
}) {
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
      <td className={`${CELL_CLASS} max-w-[5.5rem] sm:max-w-[7rem]`}>
        {dept.headName ? (
          <div className="flex items-start gap-1.5 min-w-0">
            <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full avatar-gradient text-white text-2xs font-bold flex items-center justify-center shrink-0">
              {getInitials(dept.headName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`font-semibold text-gray-800 text-xs lg:text-sm leading-snug line-clamp-2`}>
                {dept.headName}
              </p>
              {dept.headRank && (
                <p className="text-2xs text-content-muted uppercase font-medium tracking-wide leading-snug line-clamp-1 mt-0.5">
                  {dept.headRank}
                </p>
              )}
            </div>
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
