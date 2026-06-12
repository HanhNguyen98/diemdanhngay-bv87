import { memo, useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';

const DeptRowActions = memo(function DeptRowActions({
  dept,
  onUnlock,
  onBlockReport,
  onUnblockReport,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { dashboard: d } = ADMIN_UI;

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const items = [];
  if (dept.locked && !dept.unlocked) {
    items.push({ key: 'unlock', label: d.actionUnlock, onClick: () => onUnlock(dept) });
  }
  if (dept.reportBlocked) {
    items.push({ key: 'unblock', label: d.actionUnblockReport, onClick: () => onUnblockReport(dept) });
  } else {
    items.push({ key: 'block', label: d.actionBlockReport, onClick: () => onBlockReport(dept) });
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-content-muted hover:bg-neutral disabled:opacity-50"
        aria-label="Thao tác"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-panel py-1">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-primary-light/50"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default DeptRowActions;
