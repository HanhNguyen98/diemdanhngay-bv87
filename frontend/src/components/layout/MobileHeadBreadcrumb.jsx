import { memo } from 'react';
import BreadcrumbNav from '../shared/BreadcrumbNav';

/**
 * Breadcrumb một dòng cho mobile HEAD (`0.8rem`).
 * Phần cuối được truncate khi đường dẫn dài (vd. tên ĐƠN VỊ).
 *
 * @param {{ items: { label: string }[] }} props
 */
const MobileHeadBreadcrumb = memo(function MobileHeadBreadcrumb({ items }) {
  return (
    <BreadcrumbNav
      items={items}
      className="flex items-center gap-1 min-w-0 text-[0.8rem] leading-tight whitespace-nowrap overflow-hidden"
      itemClassName="min-w-0"
      lastItemClassName="truncate min-w-0 font-semibold text-navy"
      mutedItemClassName="shrink-0 text-content-muted"
    />
  );
});

export default MobileHeadBreadcrumb;
