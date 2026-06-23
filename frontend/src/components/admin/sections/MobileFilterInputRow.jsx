import { memo } from 'react';
import MobileFilterApplyRow from './MobileFilterApplyRow';

/** Mobile admin — ô lọc cuối cùng và nút Reset/Tìm kiếm trên cùng một hàng. */
const MobileFilterInputRow = memo(function MobileFilterInputRow({
  children,
  onApply,
  onReset,
  disabled = false,
  className = '',
  trailing,
}) {
  return (
    <div className={`flex items-center gap-2 w-full min-w-0 ${className}`}>
      <div className="flex-1 min-w-0">{children}</div>
      <MobileFilterApplyRow onApply={onApply} onReset={onReset} disabled={disabled} />
      {trailing}
    </div>
  );
});

export default MobileFilterInputRow;
