import { memo, useEffect } from 'react';
import { BarChart3, ClipboardList, KeyRound, LogOut, Users, X } from 'lucide-react';
import { HEAD_MOBILE_DRAWER_NAV, HEAD_NAV_IDS, UI } from '../../constants/attendance';
import { getInitials } from '../../utils/formatters';

const ICONS = {
  clipboard: ClipboardList,
  chart: BarChart3,
  users: Users,
};

const navActive = 'bg-sidebar-active text-primary';
const navIdle = 'text-content-muted hover:bg-white/70 hover:text-navy';

const MobileSideMenu = memo(function MobileSideMenu({
  open,
  onClose,
  activeNav,
  onNavChange,
  onLogout,
  user,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu điều hướng">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
        aria-label="Đóng menu"
      />

      <aside className="absolute inset-y-0 left-0 w-[min(17.5rem,82vw)] bg-sidebar-bg border-r border-gray-200/80 shadow-panel flex flex-col animate-fade-in">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-200/60 bg-white/40">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-content-muted hover:bg-white/80 hover:text-navy transition-colors"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
          {user?.fullname && (
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
              <span className="text-4xs text-content-muted truncate">{user.fullname}</span>
              <span className="w-8 h-8 rounded-full bg-primary text-white text-4xs font-bold flex items-center justify-center shrink-0">
                {getInitials(user.fullname)}
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2" aria-label="Menu chính">
          {HEAD_MOBILE_DRAWER_NAV.map(({ id, label, icon }) => {
            const Icon = ICONS[icon];
            const isActive = activeNav === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavChange(id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? navActive : navIdle
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="uppercase tracking-wide text-3xs">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-gray-200/60 bg-white/30 p-2 space-y-0.5">
          <button
            type="button"
            onClick={() => onNavChange(HEAD_NAV_IDS.PASSWORD)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activeNav === HEAD_NAV_IDS.PASSWORD ? navActive : navIdle
            }`}
          >
            <KeyRound className="w-4 h-4 shrink-0" />
            {UI.changePassword}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-danger-fg hover:bg-white/70 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {UI.logout}
          </button>
        </div>
      </aside>
    </div>
  );
});

export default MobileSideMenu;
