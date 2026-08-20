import { memo, useMemo } from 'react';
import {
  LayoutGrid,
  Library,
  Wrench,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import {
  ADMIN_TAB_IDS,
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
import { useAppBranding } from '../../../context/AppBrandingContext';
import { useAiAssistantActions } from '../../../context/AiAssistantContext';
import { useAdminUnlockRequestCount } from '../../../context/AdminUnlockRequestCountContext';
import AppLogo from '../../shared/AppLogo';
import SidebarUserCard from '../../layout/SidebarUserCard';
import AdminNavGroup from './AdminNavGroup';

const AdminSidebar = memo(function AdminSidebar({ activeTab, onTabChange, onLogout, user, className = '' }) {
  const { branding } = useAppBranding();
  const { setOpen: openAiAssistant } = useAiAssistantActions();
  const { pendingCount } = useAdminUnlockRequestCount();

  const utilitiesBadgeByTabId = useMemo(
    () => ({ [ADMIN_TAB_IDS.UTILITIES_UNLOCK_REQUESTS]: pendingCount }),
    [pendingCount],
  );

  const handleChangePassword = () => {
    onTabChange(ADMIN_TAB_IDS.PASSWORD);
  };

  return (
    <aside className={`w-[272px] shrink-0 bg-sidebar-bg border-r border-line flex flex-col min-h-screen ${className}`}>
      <div className="px-5 py-5 border-b border-line/60">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2.5 min-w-0 w-full text-left rounded-lg hover:bg-white/50 transition-colors -mx-1 px-1 py-0.5"
          aria-label="Về trang chủ"
        >
          <AppLogo logoUrl={branding.logoUrl} />
          <div className="min-w-0 flex-1">
            <p className="text-2xs font-bold text-brand-title leading-tight whitespace-nowrap">
              {branding.portalTitle}
            </p>
            <p className="text-4xs text-content-muted tracking-wide mt-0.5 whitespace-nowrap">
              {ADMIN_UI.portalSubtitle}
            </p>
          </div>
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <AdminNavGroup
          label={ADMIN_UI.nav.dashboard}
          icon={LayoutGrid}
          items={DASHBOARD_NAV}
          tabIds={DASHBOARD_TAB_IDS}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />

        <AdminNavGroup
          label={ADMIN_UI.nav.catalog}
          icon={Library}
          items={CATALOG_NAV}
          tabIds={CATALOG_TAB_IDS}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />

        <AdminNavGroup
          label={ADMIN_UI.nav.utilities}
          icon={Wrench}
          items={UTILITIES_NAV}
          tabIds={UTILITIES_TAB_IDS}
          activeTab={activeTab}
          onTabChange={onTabChange}
          badgeByTabId={utilitiesBadgeByTabId}
        />

        <AdminNavGroup
          label={ADMIN_UI.nav.settings}
          icon={Settings}
          items={SETTINGS_NAV}
          tabIds={SETTINGS_TAB_IDS}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </nav>

      <div className="mt-auto border-t border-line/60">
        {user && <SidebarUserCard user={user} onChangePassword={handleChangePassword} />}

        <div className="px-3 pb-3 space-y-0.5">
          <button
            type="button"
            onClick={() => openAiAssistant(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-content-muted hover:bg-white/70 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            {ADMIN_UI.support}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-danger-fg hover:bg-danger transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {ADMIN_UI.logout}
          </button>
        </div>
      </div>
    </aside>
  );
});

export default AdminSidebar;
