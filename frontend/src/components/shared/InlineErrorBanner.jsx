import { memo } from 'react';

/**
 * Lỗi load / validation blocking — hiển thị trong luồng trang hoặc modal.
 * Khác `FlashBanner` (toast hành động, tự ẩn).
 */
const InlineErrorBanner = memo(function InlineErrorBanner({ message, className = '' }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`bg-danger border border-danger-fg/20 text-danger-fg rounded-lg px-3 py-2 text-xs leading-snug break-words lg:px-4 lg:py-2.5 lg:text-sm lg:rounded-xl ${className}`}
    >
      {message}
    </div>
  );
});

export default InlineErrorBanner;
