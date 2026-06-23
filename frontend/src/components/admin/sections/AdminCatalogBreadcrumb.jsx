import AdminSubmenuBreadcrumb from './AdminSubmenuBreadcrumb';

export default function AdminCatalogBreadcrumb({ currentLabelKey }) {
  return (
    <AdminSubmenuBreadcrumb parentLabelKey="catalog" currentLabelKey={currentLabelKey} />
  );
}
