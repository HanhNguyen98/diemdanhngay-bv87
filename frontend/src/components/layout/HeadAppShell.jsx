import { useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import MobileTopBar from './MobileTopBar';
import MobileSideMenu from './MobileSideMenu';
import AppFooter from '../shared/AppFooter';

export default function HeadAppShell({
  user,
  activeNav,
  onNavChange,
  onLogout,
  mobileTopActions,
  children,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavChange = useCallback(
    (id) => {
      onNavChange(id);
      setMenuOpen(false);
    },
    [onNavChange],
  );

  return (
    <div className="head-app-shell flex h-[100dvh] max-h-[100dvh] overflow-hidden bg-surface-page text-sm lg:h-svh lg:max-h-svh">
      <Sidebar
        user={user}
        activeNav={activeNav}
        onNavChange={onNavChange}
        onLogout={onLogout}
        className="hidden lg:flex"
      />

      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <MobileTopBar
          user={user}
          onNavChange={handleNavChange}
          onMenuOpen={() => setMenuOpen(true)}
          actions={mobileTopActions}
        />

        <div className="head-main-scroll flex-1 min-h-0 overflow-y-auto overscroll-y-contain lg:flex lg:flex-col lg:overflow-hidden">
          <div className="head-main-page shrink-0 lg:contents lg:flex-1 lg:min-h-0 lg:flex lg:flex-col">
            {children}
          </div>
        </div>

        <AppFooter />
      </div>

      <MobileSideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        onLogout={onLogout}
        user={user}
      />
    </div>
  );
}
