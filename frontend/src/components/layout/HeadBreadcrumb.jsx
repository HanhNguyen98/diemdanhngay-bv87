import { memo } from 'react';

/** Breadcrumb desktop cổng HEAD — dùng trong `HeadPageHeader`. */
const HeadBreadcrumb = memo(function HeadBreadcrumb({ items }) {
  if (!items?.length) return null;

  return (
    <nav aria-label="Vị trí màn hình" className="flex items-center gap-1 min-w-0 text-xs leading-tight">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1 min-w-0">
            {index > 0 && (
              <span className="text-content-muted/60 select-none shrink-0" aria-hidden="true">
                &gt;
              </span>
            )}
            <span
              className={`truncate ${
                isLast ? 'font-semibold text-content-heading' : 'text-content-muted'
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

export default HeadBreadcrumb;
