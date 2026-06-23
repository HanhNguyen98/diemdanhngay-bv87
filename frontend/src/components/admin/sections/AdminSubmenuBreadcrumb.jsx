import { memo } from 'react';
import { ADMIN_UI } from '../../../constants/admin';
import AdminBreadcrumb from './AdminBreadcrumb';

const WRAPPER_CLASS =
  'lg:hidden shrink-0 border-b border-line py-2.5 mb-4 -mt-3 -mx-[clamp(0.75rem,3vw,1.25rem)] px-[clamp(0.75rem,3vw,1.25rem)] min-w-0';

const AdminSubmenuBreadcrumb = memo(function AdminSubmenuBreadcrumb({
  parentLabelKey,
  currentLabelKey,
}) {
  const parent = ADMIN_UI.nav[parentLabelKey];
  const current = ADMIN_UI.nav[currentLabelKey];
  if (!parent || !current) return null;

  return (
    <div className={WRAPPER_CLASS}>
      <AdminBreadcrumb
        items={[{ label: parent }, { label: current }]}
        mobileTruncate
      />
    </div>
  );
});

export default AdminSubmenuBreadcrumb;
