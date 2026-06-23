import { memo } from 'react';
import AdminBreadcrumb from './AdminBreadcrumb';

/** Desktop admin breadcrumb — parent group + current page. */
const SubmenuBreadcrumb = memo(function SubmenuBreadcrumb({ parent, current }) {
  return <AdminBreadcrumb items={[{ label: parent }, { label: current }]} />;
});

export default SubmenuBreadcrumb;
