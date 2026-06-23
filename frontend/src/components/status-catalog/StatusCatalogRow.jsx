import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import { ActionBtn } from '../admin/sections/ActionButtons';

const COLOR_DOT = {
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-amber-500',
  blue: 'bg-blue-500',
  teal: 'bg-teal-500',
  purple: 'bg-purple-500',
  amber: 'bg-orange-500',
};

const StatusCatalogRow = memo(function StatusCatalogRow({ item, onEdit, onDelete }) {
  const deleteBlocked = (item.usageCount ?? 0) > 0;

  return (
    <tr className="border-b border-gray-100 hover:bg-surface-page/80 transition-colors">
      <td className="py-4 px-4 text-sm font-mono font-medium text-primary">{item.code}</td>
      <td className="py-4 px-4 text-sm text-gray-800 font-semibold">{item.label}</td>
      <td className="py-4 px-4">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-700">
          <span className={`w-2.5 h-2.5 rounded-full ${COLOR_DOT[item.colorKey] || 'bg-gray-400'}`} />
          {item.badgeLabel}
        </span>
      </td>
      <td className="py-4 px-4 text-sm text-content-muted tabular-nums">{item.sortOrder}</td>
      <td className="py-4 px-4 text-sm text-content-muted tabular-nums">{item.usageCount}</td>
      <td className="py-4 px-4">
        <span
          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
            item.active ? 'badge-success' : 'badge-neutral'
          }`}
        >
          {item.active ? ADMIN_UI.statusCatalog.active : ADMIN_UI.statusCatalog.inactive}
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
                ? ADMIN_UI.catalog.deleteBlockedStatus(item.usageCount)
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

export default StatusCatalogRow;
