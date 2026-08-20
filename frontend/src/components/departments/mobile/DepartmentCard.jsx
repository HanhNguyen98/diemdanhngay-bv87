import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';
import { getInitials, parseDeptNameParts } from '../../../utils/formatters';
import AvatarStack from '../../admin/sections/AvatarStack';
import { ActionBtn } from '../../admin/sections/ActionButtons';

const { departments: d, catalog: catalogUi } = ADMIN_UI;

function DepartmentStatusBadge({ active }) {
  const isActive = active !== false;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-semibold shrink-0 ${isActive ? 'badge-dept-active' : 'badge-dept-deleted'
        }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white/80' : 'bg-white/90'}`}
        aria-hidden="true"
      />
      {isActive ? d.mobile.statusActive : d.mobile.statusDeleted}
    </span>
  );
}

const DepartmentCard = memo(function DepartmentCard({
  dept,
  showGroupName = false,
  onEdit,
  onDelete,
}) {
  const isActive = dept.active !== false;
  const deleteBlocked = (dept.staffCount ?? 0) > 0;
  const { displayName, unitCode: parsedUnitCode } = parseDeptNameParts(dept.deptName);
  const badgeLabel = dept.unitCode || parsedUnitCode || dept.deptCodeFormatted;

  return (
    <article
      className={`rounded-xl border border-line bg-surface-white shadow-card overflow-hidden ${isActive ? '' : 'opacity-80'
        }`}
    >
      <div className="p-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="shrink-0 inline-flex px-1.5 py-0.5 rounded bg-primary-light text-primary text-3xs font-semibold">
              {badgeLabel}
            </span>
            <h3 className="text-sm font-bold text-gray-800 leading-snug line-clamp-2 min-w-0 flex-1">
              {displayName}
            </h3>
            <DepartmentStatusBadge active={dept.active} />
          </div>

          {showGroupName && dept.groupName && (
            <p className="mt-1 text-xs font-medium text-info-fg leading-snug">{dept.groupName}</p>
          )}
        </div>

        <div className="mt-3 rounded-lg bg-table-header border border-primary-light px-3 py-2.5">
          <div className="flex items-start gap-2.5 min-w-0">
            {dept.headName ? (
              <div className="w-9 h-9 rounded-lg bg-primary-light text-primary text-xs font-bold flex items-center justify-center shrink-0">
                {getInitials(dept.headName)}
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-navy leading-snug line-clamp-2">
                {dept.headName || '—'}
              </p>
              {dept.headRank && (
                <p className="text-2xs text-content-muted uppercase font-medium tracking-wide leading-snug line-clamp-1 mt-0.5">
                  {dept.headRank}
                </p>
              )}
            </div>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-3 min-w-0">
            <span className="text-3xs font-semibold text-content-muted uppercase tracking-wide leading-none">
              {d.mobile.headRole}
            </span>
            <span className="text-xs text-content-muted leading-none shrink-0">
              <span className="font-bold text-primary tabular-nums">{dept.staffCount}</span>{' '}
              {d.mobile.staffLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="px-3.5 py-2 border-t border-line bg-attendance-search flex items-center gap-2">
        <AvatarStack count={dept.staffCount} />
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <ActionBtn
            icon={Pencil}
            onClick={() => onEdit(dept)}
            colorClass="bg-surface-white text-gray-600 hover:bg-neutral"
            label="Sửa"
          />
          {isActive && (
            <ActionBtn
              icon={Trash2}
              onClick={() => onDelete(dept)}
              disabled={deleteBlocked}
              title={deleteBlocked ? catalogUi.deleteBlockedDept(dept.staffCount) : 'Xóa'}
              colorClass="text-danger-fg bg-danger hover:bg-danger/80 border-danger/30"
              label="Xóa"
            />
          )}
        </div>
      </div>
    </article>
  );
});

export default DepartmentCard;
