import { memo } from 'react';

/** Breadcrumb desktop Admin — nhóm submenu + trang hiện tại (2 cấp). */
const SubmenuBreadcrumb = memo(function SubmenuBreadcrumb({ parent, current }) {
  return (
    <nav
      className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-content-muted"
      aria-label="Đường dẫn"
    >
      <span className="tracking-wide">{parent}</span>
      <span className="text-content-muted/50 select-none" aria-hidden="true">
        &gt;
      </span>
      <span className="text-gray-800">{current}</span>
    </nav>
  );
});

export default SubmenuBreadcrumb;
