import { memo, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';

const AdminNavGroup = memo(function AdminNavGroup({
  label,
  icon: Icon,
  items,
  tabIds,
  activeTab,
  onTabChange,
  badgeByTabId = {},
}) {
  const isGroupActive = tabIds.includes(activeTab);
  const [open, setOpen] = useState(isGroupActive);

  useEffect(() => {
    if (isGroupActive) setOpen(true);
  }, [isGroupActive]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          isGroupActive
            ? 'bg-sidebar-active text-primary font-semibold'
            : 'text-content-muted hover:bg-white/60'
        }`}
        aria-expanded={open}
        title={label}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left truncate min-w-0" title={label}>
          {label}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="mt-0.5 ml-4 pl-3 border-l border-line/80 space-y-0.5">
          {items.map(({ id, labelKey }) => {
            const isActive = activeTab === id;
            const badgeCount = badgeByTabId[id] ?? 0;
            const showBadge = badgeCount > 0;
            const badgeLabel =
              badgeCount > 99 ? '99+' : String(badgeCount);
            const navLabel = ADMIN_UI.nav[labelKey];
            const itemTitle = showBadge
              ? `${navLabel} (${badgeCount} chờ xác nhận)`
              : navLabel;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-sidebar-active text-primary font-semibold'
                    : 'text-content-muted hover:bg-white/60'
                }`}
                aria-label={
                  showBadge ? `${navLabel}, ${badgeCount} chờ xác nhận` : navLabel
                }
                title={itemTitle}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="truncate flex-1 min-w-0">{navLabel}</span>
                  {showBadge && (
                    <span className="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-danger-fg text-white text-2xs font-bold tabular-nums inline-flex items-center justify-center">
                      {badgeLabel}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default AdminNavGroup;
