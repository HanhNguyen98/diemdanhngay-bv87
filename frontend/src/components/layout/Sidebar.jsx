import { BarChart3, ClipboardList, HelpCircle, Library, LogOut } from 'lucide-react';
import {
  UI,
  HEAD_NAV,
  HEAD_NAV_IDS,
  HEAD_CATALOG_NAV,
  HEAD_CATALOG_TAB_IDS,
} from '../../constants/attendance';
import HeadNavGroup from './HeadNavGroup';
import { useAppBranding } from '../../context/AppBrandingContext';
import AppLogo from '../shared/AppLogo';
import SidebarUserCard from './SidebarUserCard';

export default function Sidebar({ user, activeNav, onNavChange, onLogout, className = '' }) {
  const { branding } = useAppBranding();

  const handleChangePassword = () => {
    onNavChange(HEAD_NAV_IDS.PASSWORD);
  };

  return (
    <aside
      className={`w-[240px] shrink-0 bg-sidebar-bg border-r border-gray-200 flex flex-col min-h-screen ${className}`}
    >
      <div className="px-5 py-4 border-b border-gray-200/60">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2.5 min-w-0 w-full text-left rounded-lg hover:bg-white/50 transition-colors -mx-1 px-1 py-0.5"
          aria-label="Về trang chủ"
        >
          <AppLogo logoUrl={branding.logoUrl} />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xs font-bold text-brand-title leading-tight whitespace-nowrap">
              {branding.portalTitle}
            </h1>
            <p className="text-4xs text-content-muted tracking-wide mt-0.5 whitespace-nowrap">
              {UI.appSubtitleHead}
            </p>
          </div>
        </button>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {HEAD_NAV.map((item) => {
          const isActive = activeNav === item.id;
          const NavIcon = item.icon === 'chart' ? BarChart3 : ClipboardList;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-sidebar-active text-primary'
                  : 'text-content-muted hover:bg-white/60'
              }`}
            >
              <NavIcon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          );
        })}

        <HeadNavGroup
          label={UI.headCatalog}
          icon={Library}
          items={HEAD_CATALOG_NAV}
          tabIds={HEAD_CATALOG_TAB_IDS}
          activeNav={activeNav}
          onNavChange={onNavChange}
        />
      </nav>

      <div className="mt-auto border-t border-gray-200/60">
        {user && <SidebarUserCard user={user} onChangePassword={handleChangePassword} />}

        <div className="px-3 pb-3 space-y-0.5">
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-content-muted hover:bg-white/70 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            {UI.support}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-danger-fg hover:bg-danger transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {UI.logout}
          </button>
        </div>
      </div>
    </aside>
  );
}
