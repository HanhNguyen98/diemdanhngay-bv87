import { Fragment, memo } from 'react';

const SEPARATOR_CLASS = 'text-content-muted/50 select-none shrink-0 px-0.5';

/**
 * Shared breadcrumb renderer — ensures "Text > Text" spacing on mobile and desktop.
 */
const BreadcrumbNav = memo(function BreadcrumbNav({
  items,
  className = '',
  itemClassName = '',
  lastItemClassName = 'font-semibold text-content-heading',
  mutedItemClassName = 'text-content-muted',
  separatorClassName = SEPARATOR_CLASS,
  'aria-label': ariaLabel = 'Vị trí màn hình',
}) {
  if (!items?.length) return null;

  return (
    <nav aria-label={ariaLabel} className={className}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <span className={separatorClassName} aria-hidden="true">
                &gt;
              </span>
            )}
            <span
              className={`${itemClassName} ${isLast ? lastItemClassName : mutedItemClassName}`}
              aria-current={isLast ? 'page' : undefined}
            >
              {item.label}
            </span>
          </Fragment>
        );
      })}
    </nav>
  );
});

export default BreadcrumbNav;
