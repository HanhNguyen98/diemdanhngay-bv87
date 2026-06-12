import { memo, useEffect, useRef, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { UI } from '../../constants/attendance';
import { getInitials } from '../../utils/formatters';

const SidebarUserCard = memo(function SidebarUserCard({ user, onChangePassword }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const roleLabel =
    user?.roleLabel ||
    (user?.role === 'HEAD' ? 'TRƯỞNG Đơn vị' : user?.role === 'ADMIN' ? 'Quản trị viên' : '');

  return (
    <div ref={rootRef} className="relative px-3 pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left ${open ? 'bg-white shadow-sm' : 'hover:bg-white/70'
          }`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={user?.fullname}
      >
        <div className="w-8 h-8 rounded-full bg-primary text-white text-2xs font-bold flex items-center justify-center shrink-0 ring-2 ring-white">
          {getInitials(user?.fullname)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-3xs font-semibold text-gray-800 leading-tight whitespace-nowrap">
            {user?.fullname}
          </p>
          <p className="text-4xs text-content-muted leading-tight mt-0.5 tracking-tight">{roleLabel}</p>
        </div>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-3 right-3 bottom-full mb-1.5 bg-white border border-gray-200 rounded-lg shadow-panel overflow-hidden z-30"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onChangePassword();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-primary-light transition-colors"
          >
            <KeyRound className="w-4 h-4 text-primary shrink-0" />
            {UI.changePassword}
          </button>
        </div>
      )}
    </div>
  );
});

export default SidebarUserCard;
