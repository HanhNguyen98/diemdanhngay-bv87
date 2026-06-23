import { memo } from 'react';
import BreadcrumbNav from '../../shared/BreadcrumbNav';

/**
 * Admin breadcrumb — Segoe UI, text-sm; current page semibold gray-800.
 *
 * @param {{ items: { label: string }[], className?: string, mobileTruncate?: boolean }} props
 */
const AdminBreadcrumb = memo(function AdminBreadcrumb({
  items,
  className = '',
  mobileTruncate = false,
}) {
  return (
    <BreadcrumbNav
      items={items}
      aria-label="Đường dẫn"
      className={`flex items-center min-w-0 text-sm gap-1 ${
        mobileTruncate ? 'whitespace-nowrap overflow-hidden' : 'flex-wrap'
      } ${className}`}
      itemClassName="truncate min-w-0"
      lastItemClassName="truncate min-w-0 font-semibold text-content-heading"
      mutedItemClassName="truncate text-content-muted"
    />
  );
});

export default AdminBreadcrumb;
