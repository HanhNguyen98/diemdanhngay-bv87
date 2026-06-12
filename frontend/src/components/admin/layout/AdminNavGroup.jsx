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
            ? 'bg-sidebar-active text-primary'
            : 'text-content-muted hover:bg-white/60'
        }`}
        aria-expanded={open}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="mt-0.5 ml-4 pl-3 border-l border-gray-200/80 space-y-0.5">
          {items.map(({ id, labelKey }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-sidebar-active text-primary'
                    : 'text-content-muted hover:bg-white/60'
                }`}
              >
                {ADMIN_UI.nav[labelKey]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default AdminNavGroup;
