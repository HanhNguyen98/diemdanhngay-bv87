import { memo } from 'react';
import { Pencil, Trash2, ClipboardList, List } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';

const COLOR_PILL_CLASS_BY_KEY = {
  green: 'bg-success text-success-fg',
  red: 'bg-danger text-danger-fg',
  yellow: 'bg-warning text-warning-fg',
  blue: 'bg-info text-info-fg',
  teal: 'bg-info text-info-fg',
  amber: 'bg-warning text-warning-fg',
  purple: 'bg-info text-info-fg',
};

function ThinIcon({ icon: Icon, className = '' }) {
  return <Icon className={className} strokeWidth={1.5} />;
}

function IconButton({ icon: Icon, onClick, className = '', ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${className}`}
    >
      <ThinIcon icon={Icon} className="w-3.5 h-3.5" />
    </button>
  );
}

const StatusCatalogCard = memo(function StatusCatalogCard({
  item,
  onEdit,
  onDelete,
  onToggleActive,
  toggling = false,
}) {
  const pillClass = COLOR_PILL_CLASS_BY_KEY[item.colorKey] || 'bg-neutral text-neutral-fg';
  const statusLabel = item.active ? ADMIN_UI.statusCatalog.active : ADMIN_UI.statusCatalog.inactive;
  const deleteBlocked = (item.usageCount ?? 0) > 0;

  return (
    <article className="rounded-xl border border-line bg-surface-white shadow-card overflow-hidden">
      <div className="p-3 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <div className="text-4xs text-content-muted font-semibold uppercase tracking-wide tabular-nums">
              {item.code}
            </div>
            <h3 className="mt-0.5 text-sm font-semibold text-gray-800 leading-snug">
              {item.label}
            </h3>
          </div>

          <div className="flex-shrink-0">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-4xs font-semibold ${pillClass}`}
            >
              {item.badgeLabel}
            </span>
          </div>
        </div>

        <div className="border-t border-line/60" aria-hidden="true" />

        <div className="grid grid-cols-2 gap-3 items-center">
          <div>
            <div className="flex items-center gap-1.5 text-3xs font-medium text-content-muted">
              <ThinIcon icon={List} className="w-3 h-3" />
              <span className="leading-none">
                Thứ tự: <span className="font-semibold text-gray-800 tabular-nums">{item.sortOrder}</span>
              </span>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="flex items-center gap-1.5 text-3xs font-medium text-content-muted">
              <ThinIcon icon={ClipboardList} className="w-3 h-3" />
              <span className="leading-none">
                Sử dụng: <span className="font-semibold text-gray-800 tabular-nums">{item.usageCount}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-4xs font-semibold text-content-muted uppercase tracking-wide">
              Trạng thái
            </span>
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={item.active}
                disabled={toggling}
                onChange={() => onToggleActive(item)}
                aria-label={`${item.label} - ${statusLabel}`}
                className="peer sr-only"
              />
              <div
                className={`w-10 h-5 rounded-full transition-colors border border-line ${
                  item.active ? 'bg-primary border-primary/30' : 'bg-neutral'
                } ${toggling ? 'opacity-70' : ''}`}
              >
                <div
                  className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-150 ${
                    item.active ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <IconButton
              icon={Pencil}
              onClick={() => onEdit(item)}
              className="text-content-muted hover:bg-neutral"
              ariaLabel="Sửa"
            />
            <IconButton
              icon={Trash2}
              onClick={() => !deleteBlocked && onDelete(item)}
              className={
                deleteBlocked
                  ? 'text-danger-fg/40 cursor-not-allowed'
                  : 'text-danger-fg hover:bg-danger'
              }
              ariaLabel="Xóa"
            />
          </div>
        </div>
      </div>
    </article>
  );
});

export default StatusCatalogCard;

