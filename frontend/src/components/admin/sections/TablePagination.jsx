import { memo } from 'react';
import DesktopPagination from '../../shared/DesktopPagination';

/** Phân trang grid table admin — đồng bộ layout màn Điểm danh (embedded). */
const TablePagination = memo(function TablePagination(props) {
  return <DesktopPagination embedded useEllipsis {...props} />;
});

export default TablePagination;
