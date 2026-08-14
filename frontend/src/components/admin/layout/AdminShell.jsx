import { memo, useCallback, useState } from 'react';
import { MOBILE_SHELL_BOTTOM_PADDING_CLASS } from '../../../constants/adminTabs';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
import AdminFooter from './AdminFooter';
import AdminMobileTopBar from './AdminMobileTopBar';
import AdminMobileSideMenu from './AdminMobileSideMenu';

const AdminShell = memo(function AdminShell({
  activeTab,
  onTabChange,
  user,
  onLogout,
  children,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleTabChange = useCallback(
    (tab) => {
      onTabChange(tab);
      setMenuOpen(false);
    },
    [onTabChange],
  );

  return (
    <div className="admin-shell flex h-[100dvh] max-h-[100dvh] max-w-full overflow-hidden bg-surface-page lg:h-svh lg:max-h-svh">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={onLogout}
        user={user}
        className="hidden lg:flex"
      />
      <div className="flex-1 min-w-0 max-w-full flex flex-col min-h-0 overflow-x-hidden">
        <AdminMobileTopBar onMenuOpen={() => setMenuOpen(true)} />
        <AdminTopBar activeTab={activeTab} />
        <main className={`mobile-page-y flex-1 min-h-0 flex flex-col overscroll-y-contain lg:overflow-y-auto px-[clamp(0.75rem,3vw,1.25rem)] py-3 ${MOBILE_SHELL_BOTTOM_PADDING_CLASS} lg:p-6`}>
          {children}
        </main>
        <AdminFooter />
      </div>

      <AdminMobileSideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={onLogout}
        user={user}
      />
    </div>
  );
});

export default AdminShell;
