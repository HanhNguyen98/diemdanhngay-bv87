import { memo } from 'react';
import HeadBreadcrumb from './HeadBreadcrumb';

const HeadPageHeader = memo(function HeadPageHeader({ breadcrumb, breadcrumbSlot, children, adminSlot }) {
  return (
    <header className="sticky top-0 z-20 shrink-0 bg-surface-page/95 backdrop-blur-sm border-b border-line">
      <div className="px-4 lg:px-6 py-2">
        {adminSlot}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between min-h-[32px]">
          {breadcrumbSlot ?? <HeadBreadcrumb items={breadcrumb} />}
          {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
        </div>
      </div>
    </header>
  );
});

export default HeadPageHeader;
