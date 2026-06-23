import { memo } from 'react';
import BreadcrumbNav from '../shared/BreadcrumbNav';

/** Breadcrumb desktop cổng HEAD — dùng trong `HeadPageHeader`. */
const HeadBreadcrumb = memo(function HeadBreadcrumb({ items }) {
  return (
    <BreadcrumbNav
      items={items}
      className="flex items-center gap-1 min-w-0 text-xs leading-tight"
      itemClassName="truncate min-w-0"
      lastItemClassName="truncate min-w-0 font-semibold text-content-heading"
      mutedItemClassName="truncate text-content-muted"
    />
  );
});

export default HeadBreadcrumb;
