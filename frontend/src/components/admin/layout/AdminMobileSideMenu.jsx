import { memo, useEffect } from 'react';
import {
  LayoutGrid,
  Library,
  Wrench,
  Settings,
  HelpCircle,
  LogOut,
  X,
} from 'lucide-react';
import {
  ADMIN_UI,
  DASHBOARD_NAV,
  DASHBOARD_TAB_IDS,
  CATALOG_NAV,
  CATALOG_TAB_IDS,
  UTILITIES_NAV,
  UTILITIES_TAB_IDS,
  SETTINGS_NAV,
  SETTINGS_TAB_IDS,
} from '../../../constants/admin';
import { useAiAssistantActions } from '../../../context/AiAssistantContext';
import { getInitials } from '../../../utils/formatters';
import AdminNavGroup from './AdminNavGroup';

const AdminMobileSideMenu = memo(function AdminMobileSideMenu({
  open,
  onClose,
  activeTab,
  onTabChange,
  onLogout,
  user,
}) {
  const { setOpen: openAiAssistant } = useAiAssistantActions();

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleTabChange = (tab) => {
    onTabChange(tab);
    onClose();
  };

  return (
    <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu điều hướng">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
        aria-label="Đóng menu"
      />

      <aside className="absolute inset-y-0 left-0 w-[min(17.5rem,82vw)] bg-sidebar-bg border-r border-line/80 shadow-panel flex flex-col animate-fade-in">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-line/60 bg-white/40">
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

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Menu chính">
          <AdminNavGroup
            label={ADMIN_UI.nav.dashboard}
            icon={LayoutGrid}
            items={DASHBOARD_NAV}
            tabIds={DASHBOARD_TAB_IDS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          <AdminNavGroup
            label={ADMIN_UI.nav.catalog}
            icon={Library}
            items={CATALOG_NAV}
            tabIds={CATALOG_TAB_IDS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          <AdminNavGroup
            label={ADMIN_UI.nav.utilities}
            icon={Wrench}
            items={UTILITIES_NAV}
            tabIds={UTILITIES_TAB_IDS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          <AdminNavGroup
            label={ADMIN_UI.nav.settings}
            icon={Settings}
            items={SETTINGS_NAV}
            tabIds={SETTINGS_TAB_IDS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </nav>

        <div className="border-t border-line/60 px-3 py-3 space-y-0.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              openAiAssistant(true);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-content-muted hover:bg-white/70 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            {ADMIN_UI.support}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-danger-fg hover:bg-danger transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {ADMIN_UI.logout}
          </button>
        </div>
      </aside>
    </div>
  );
});

export default AdminMobileSideMenu;
