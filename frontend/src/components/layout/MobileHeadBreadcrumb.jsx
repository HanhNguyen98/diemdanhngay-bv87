import { memo } from 'react';

/**
 * Breadcrumb một dòng cho mobile HEAD (`text-4xs`).
 * Phần cuối được truncate khi đường dẫn dài (vd. tên ĐƠN VỊ).
 *
 * @param {{ items: { label: string }[] }} props
 */
const MobileHeadBreadcrumb = memo(function MobileHeadBreadcrumb({ items }) {
  if (!items?.length) return null;

  return (
    <nav
      aria-label="Vị trí màn hình"
      className="flex items-center min-w-0 text-4xs leading-tight whitespace-nowrap overflow-hidden"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center min-w-0">
            {index > 0 && (
              <span className="mx-1 text-content-muted/50 select-none shrink-0" aria-hidden="true">
                &gt;
              </span>
            )}
            <span
              className={`${isLast ? 'truncate min-w-0 font-semibold text-navy' : 'shrink-0 text-content-muted'
                }`}
              aria-current={isLast ? 'page' : undefined}
            >
              {item.label}
            </span>
          </span>
        );
      })}
    </nav>
  );
});

export default MobileHeadBreadcrumb;
