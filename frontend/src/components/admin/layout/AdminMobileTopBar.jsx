import { memo } from 'react';
import { Menu } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';
import { useAppBranding } from '../../../context/AppBrandingContext';
import AppLogo from '../../shared/AppLogo';

const AdminMobileTopBar = memo(function AdminMobileTopBar({ onMenuOpen }) {
  const { branding } = useAppBranding();

  return (
    <header className="lg:hidden sticky top-0 z-30 shrink-0 border-b border-line bg-surface-page/95 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-[clamp(0.75rem,3vw,1.25rem)] py-2 min-h-[3rem]">
        <button
          type="button"
          onClick={onMenuOpen}
          className="w-9 h-9 rounded-lg border border-line bg-white flex items-center justify-center text-navy hover:bg-neutral transition-colors shrink-0"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 min-w-0 flex-1 text-left rounded-lg hover:bg-neutral/80 transition-colors -my-0.5 py-0.5 pr-1"
          aria-label="Về trang chủ"
        >
          <AppLogo
            logoUrl={branding.logoUrl}
            className="w-8 h-8 rounded-lg shrink-0 object-cover"
            fallbackClassName="w-8 h-8 rounded-lg shrink-0 bg-primary flex items-center justify-center text-white shadow-sm"
            iconClassName="w-4 h-4"
          />
          <div className="min-w-0 flex-1">
            <p className="text-3xs font-bold text-brand-title leading-tight truncate">{branding.portalTitle}</p>
            <p className="text-4xs text-content-muted truncate">{ADMIN_UI.portalSubtitle}</p>
          </div>
        </button>
      </div>
    </header>
  );
});

export default AdminMobileTopBar;
