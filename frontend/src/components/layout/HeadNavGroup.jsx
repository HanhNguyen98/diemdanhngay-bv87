import { memo, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const HeadNavGroup = memo(function HeadNavGroup({
  label,
  icon: Icon,
  items,
  tabIds,
  activeNav,
  onNavChange,
}) {
  const isGroupActive = tabIds.includes(activeNav);
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
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-0.5 ml-4 pl-3 border-l border-gray-200/80 space-y-0.5">
          {items.map(({ id, label: itemLabel }) => {
            const isActive = activeNav === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavChange(id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-sidebar-active text-primary'
                    : 'text-content-muted hover:bg-white/60'
                }`}
              >
                {itemLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default HeadNavGroup;
