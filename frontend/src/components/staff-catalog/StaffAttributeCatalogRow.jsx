import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import { ActionBtn } from '../admin/sections/ActionButtons';

const StaffAttributeCatalogRow = memo(function StaffAttributeCatalogRow({
  item,
  config,
  onEdit,
  onDelete,
}) {
  const ui = config.ui();
  const name = item[config.nameField];
  const codeFormatted = item[config.codeFormattedField];
  const deleteBlocked = (item.usageCount ?? 0) > 0;

  return (
    <tr className="border-b border-gray-100 hover:bg-surface-page/80 transition-colors">
      <td className="py-4 px-4 text-sm font-medium text-primary tabular-nums">{codeFormatted}</td>
      <td className="py-4 px-4 text-sm text-gray-800 font-semibold">{name}</td>
      <td className="py-4 px-4 text-sm text-content-muted tabular-nums">{item.sortOrder}</td>
      <td className="py-4 px-4 text-sm text-content-muted tabular-nums">{item.usageCount}</td>
      <td className="py-4 px-4">
        <span
          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
            item.active ? 'badge-success' : 'badge-neutral'
          }`}
        >
          {item.active ? ui.active : ui.inactive}
        </span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1.5 justify-end">
          <ActionBtn
            icon={Pencil}
            onClick={() => onEdit(item)}
            colorClass="text-gray-600 hover:bg-neutral"
            label="Sửa"
          />
          <ActionBtn
            icon={Trash2}
            onClick={() => onDelete(item)}
            disabled={deleteBlocked}
            title={
              deleteBlocked
                ? ADMIN_UI.catalog.deleteBlockedStaff(item.usageCount)
                : 'Xóa'
            }
            colorClass="text-danger-fg hover:bg-danger"
            label="Xóa"
          />
        </div>
      </td>
    </tr>
  );
});

export default StaffAttributeCatalogRow;
