import { memo, useMemo } from 'react';
import { UI } from '../../../constants/attendance';
import { ADMIN_TAB_IDS, ADMIN_UI, ADMIN_SUBMENU_GROUPS } from '../../../constants/admin';
import SubmenuBreadcrumb from '../sections/SubmenuBreadcrumb';

function resolveSubmenuBreadcrumb(activeTab) {
  if (activeTab === ADMIN_TAB_IDS.PASSWORD) {
    return { parent: ADMIN_UI.nav.settings, current: UI.changePassword };
  }
  for (const group of ADMIN_SUBMENU_GROUPS) {
    if (!group.tabIds.includes(activeTab)) continue;
    const item = group.items.find((nav) => nav.id === activeTab);
    if (!item) continue;
    return {
      parent: ADMIN_UI.nav[group.parentLabelKey],
      current: ADMIN_UI.nav[item.labelKey],
    };
  }
  return null;
}

const AdminTopBar = memo(function AdminTopBar({ activeTab }) {
  const breadcrumb = useMemo(() => resolveSubmenuBreadcrumb(activeTab), [activeTab]);

  return (
    <header className="hidden lg:block sticky top-0 z-30 bg-surface-white border-b border-line px-5 py-2 shrink-0">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          {breadcrumb && (
            <SubmenuBreadcrumb parent={breadcrumb.parent} current={breadcrumb.current} />
          )}
        </div>
      </div>
    </header>
  );
});

export default AdminTopBar;
