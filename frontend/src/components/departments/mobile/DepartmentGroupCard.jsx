import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';
import { ActionBtn } from '../../admin/sections/ActionButtons';

const { departmentGroups: g, catalog: catalogUi } = ADMIN_UI;
const { mobile: m } = g;

const DepartmentGroupCard = memo(function DepartmentGroupCard({ group, onEdit, onDelete }) {
  const hasDepts = (group.deptCount ?? 0) > 0;
  const deleteBlocked = hasDepts;

  return (
    <article className="rounded-xl border border-line bg-surface-white shadow-card overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-3xs font-semibold text-primary tabular-nums">
            {m.codePrefix}: {group.groupCodeFormatted}
          </p>
          <h3 className="mt-0.5 text-sm font-bold text-gray-800 uppercase leading-snug line-clamp-2">
            {group.groupName}
          </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ActionBtn
            icon={Pencil}
            onClick={() => onEdit(group)}
            colorClass="text-primary hover:bg-primary-light"
            label="Sửa"
          />
          <ActionBtn
            icon={Trash2}
            onClick={() => onDelete(group)}
            disabled={deleteBlocked}
            title={
              deleteBlocked ? catalogUi.deleteBlockedGroup(group.deptCount) : 'Xóa'
            }
            colorClass="text-danger-fg hover:bg-danger"
            label="Xóa"
          />
        </div>
      </div>

      <div className="border-t border-line" aria-hidden="true" />

      <div className="px-4 py-3 grid grid-cols-2 gap-4">
        <div>
          <p className="text-4xs font-semibold text-content-muted">{m.sortOrderLabel}</p>
          <p className="mt-0.5 text-sm font-bold text-gray-800 tabular-nums">{group.sortOrder}</p>
        </div>
        <div>
          <p className="text-4xs font-semibold text-content-muted">{m.deptCountLabel}</p>
          <p
            className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-gray-800 tabular-nums"
            aria-label={`${group.deptCount} đơn vị`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                hasDepts ? 'bg-success-fg' : 'bg-neutral-fg'
              }`}
              aria-hidden="true"
            />
            {group.deptCount ?? 0}
          </p>
        </div>
      </div>
    </article>
  );
});

export default DepartmentGroupCard;
