import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';

const StaffAttributeCatalogCard = memo(function StaffAttributeCatalogCard({
  item,
  config,
  onEdit,
  onDelete,
  onToggleActive,
  toggling = false,
}) {
  const ui = config.ui();
  const name = item[config.nameField];
  const codeFormatted = item[config.codeFormattedField];
  const deleteBlocked = (item.usageCount ?? 0) > 0;
  const statusLabel = item.active ? ui.active : ui.inactive;

  return (
    <article className="rounded-xl border border-line bg-surface-white shadow-card overflow-hidden">
      <div className="p-3 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <div className="text-4xs text-content-muted font-semibold uppercase tracking-wide tabular-nums">
              {codeFormatted}
            </div>
            <h3 className="mt-0.5 text-sm font-semibold text-gray-800 leading-snug">{name}</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-3xs text-content-muted">
          <div>
            Thứ tự:{' '}
            <span className="font-semibold text-gray-800 tabular-nums">{item.sortOrder}</span>
          </div>
          <div className="text-right">
            Sử dụng:{' '}
            <span className="font-semibold text-gray-800 tabular-nums">{item.usageCount}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-4xs font-semibold text-content-muted uppercase tracking-wide">
              {ui.columns.status}
            </span>
            <label className="relative flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={item.active}
                disabled={toggling}
                onChange={() => onToggleActive(item)}
                aria-label={`${name} - ${statusLabel}`}
                className="peer sr-only"
              />
              <div
                className={`w-10 h-5 rounded-full transition-colors border border-line ${item.active ? 'bg-primary border-primary/30' : 'bg-neutral'
                  } ${toggling ? 'opacity-70' : ''}`}
              >
                <div
                  className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-150 ${item.active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </div>
            </label>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(item)}
              aria-label="Sửa"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-content-muted hover:bg-neutral transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => !deleteBlocked && onDelete(item)}
              disabled={deleteBlocked}
              title={
                deleteBlocked
                  ? ADMIN_UI.catalog.deleteBlockedStaff(item.usageCount)
                  : 'Xóa'
              }
              aria-label="Xóa"
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${deleteBlocked
                  ? 'text-danger-fg/40 cursor-not-allowed'
                  : 'text-danger-fg hover:bg-danger'
                }`}
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
});

export default StaffAttributeCatalogCard;
