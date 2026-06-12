import { memo } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
import AdminFooter from './AdminFooter';

const AdminShell = memo(function AdminShell({
  activeTab,
  onTabChange,
  user,
  onLogout,
  children,
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-page">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        onLogout={onLogout}
        user={user}
      />
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <AdminTopBar activeTab={activeTab} />
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden p-6">{children}</main>
        <AdminFooter />
      </div>
    </div>
  );
});

export default AdminShell;
