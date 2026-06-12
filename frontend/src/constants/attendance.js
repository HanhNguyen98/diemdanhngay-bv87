/**
 * Vietnamese UI labels and messages for attendance module.
 * Enum keys match backend AttendanceStatus values.
 */

/** Trạng thái chấm công — khớp backend AttendanceStatus */
export const ATTENDANCE_STATUS = {
  DI_LAM: 'DI_LAM',
  NGHI_PHEP: 'NGHI_PHEP',
  DI_HOC: 'DI_HOC',
  DI_CONG_TAC: 'DI_CONG_TAC',
};

/** Bộ lọc trạng thái trên bảng */
export const ATTENDANCE_FILTER = {
  ALL: 'ALL',
  UNCHECKED: 'UNCHECKED',
};

/** Chưa chấm: backend trả recordId và status đều null */
export function isAttendanceUnchecked(staff) {
  return staff.recordId == null || staff.status == null;
}

export const STATUS_OPTIONS = [
  { value: ATTENDANCE_STATUS.DI_LAM, label: 'Đi làm' },
  { value: ATTENDANCE_STATUS.NGHI_PHEP, label: 'Nghỉ phép' },
  { value: ATTENDANCE_STATUS.DI_HOC, label: 'Đi học' },
  { value: ATTENDANCE_STATUS.DI_CONG_TAC, label: 'Công tác' },
];

/** 4 nút chấm nhanh — khớp mockup */
export const QUICK_ACTIONS = [
  { value: ATTENDANCE_STATUS.DI_LAM, color: 'green', icon: 'check' },
  { value: ATTENDANCE_STATUS.NGHI_PHEP, color: 'red', icon: 'x' },
  { value: ATTENDANCE_STATUS.DI_HOC, color: 'yellow', icon: 'graduation' },
  { value: ATTENDANCE_STATUS.DI_CONG_TAC, color: 'blue', icon: 'briefcase' },
];

/** Cột bảng — khớp mockup toolbar + grid header */
export const ATTENDANCE_TABLE_COLUMNS = [
  { key: 'employee', label: 'NHÂN VIÊN', align: 'left', width: '30%' },
  { key: 'rank', label: 'CẤP BẬC', align: 'left', width: '13%' },
  { key: 'position', label: 'CHỨC VỤ', align: 'left', width: '15%' },
  { key: 'status', label: 'TRẠNG THÁI HIỆN TẠI', align: 'left', width: '22%' },
  { key: 'actions', label: 'CHẤM CÔNG NHANH', align: 'right', width: '20%' },
];

/** Trạng thái hiển thị trên badge (chưa chấm → UNCHECKED) */
export const STATUS_BADGE = {
  [ATTENDANCE_STATUS.DI_LAM]: {
    label: 'ĐI LÀM',
    className: 'badge-status-present',
    icon: 'check',
  },
  [ATTENDANCE_STATUS.NGHI_PHEP]: {
    label: 'NGHỈ PHÉP',
    className: 'badge-status-absent',
    icon: 'x',
  },
  [ATTENDANCE_STATUS.DI_HOC]: {
    label: 'ĐI HỌC',
    className: 'badge-status-study',
    icon: 'graduation',
  },
  [ATTENDANCE_STATUS.DI_CONG_TAC]: {
    label: 'CÔNG TÁC',
    className: 'badge-status-trip',
    icon: 'briefcase',
  },
  UNCHECKED: {
    label: 'CHƯA XÁC NHẬN',
    className: 'badge-status-pending',
    icon: 'pending',
  },
};

export const DEFAULT_LOCK_MESSAGE =
  'Hệ thống đã tự động khóa. Liên hệ Admin nếu cần chỉnh sửa.';

/** Ô vuông icon trên KPI card trạng thái chấm công */
export const KPI_METRIC_ICON_BOX = 'h-11 w-11';
export const KPI_METRIC_ICON_SIZE = 'h-5 w-5';

export const UI = {
  appName: 'BỆNH VIỆN QUÂN Y 87',
  appSubtitleAdmin: 'Admin Center',
  appSubtitleHead: 'HỆ THỐNG CHẤM CÔNG',
  footerCopyright:
    '© 2026 BỆNH VIỆN QUÂN Y 87 — Hệ thống Chấm công phát triển bởi Tham mưu - Hành chính',
  footerCopyrightMobile:
    '© 2026 Hệ thống Chấm công phát triển bởi Tham mưu - Hành chính',
  pageTitle: 'CHẤM CÔNG HẰNG NGÀY',
  staffListTitle: 'Danh sách nhân sự',
  kpiProgress: 'TIẾN ĐỘ CHẤM CÔNG',
  kpiPresent: 'ĐI LÀM',
  kpiAbsent: 'NGHỈ PHÉP',
  kpiStudy: 'ĐI HỌC',
  kpiDuty: 'ĐI CÔNG TÁC',
  employeesCapitalized: 'Nhân viên',
  loginTitle: 'Đăng nhập',
  logout: 'Đăng xuất',
  support: 'Hỗ trợ',
  refresh: 'Làm mới',
  loading: 'Đang tải dữ liệu...',
  readOnly: 'CHẾ ĐỘ XEM',
  readOnlyLong: 'Chế độ chỉ xem',
  viewingHistoryPrefix: 'Đang xem dữ liệu ngày',
  viewingHistorySuffix: '— chỉ xem, không chỉnh sửa',
  lockedBadge: 'ĐÃ KHÓA SỔ',
  unlockButton: 'Mở khóa ngày',
  unlockModalTitle: 'XÁC NHẬN CẤP QUYỀN SỬA ĐỔI ĐẶC CÁCH',
  searchPlaceholder: 'Tìm tên nhân viên hoặc mã số...',
  filterButton: 'Bộ lọc',
  filterByStatus: 'Lọc theo trạng thái',
  filterAll: 'Tất cả',
  filterUnchecked: 'Chưa chấm',
  progressTitle: 'TIẾN ĐỘ CHẤM CÔNG',
  quickReportTitle: 'Báo cáo nhanh',
  quickReportDesc: 'Gửi dữ liệu trực tiếp cho Admin tổng',
  sendReportButton: 'Gửi báo cáo',
  sendReportFull: 'Gửi báo cáo cho Admin',
  reportSent: 'Đã gửi báo cáo',
  reportSendSuccess: 'Gửi báo cáo quân số thành công.',
  reportBlocked: 'Admin đã khóa gửi báo cáo cho ĐƠN VỊ hôm nay.',
  reportIncomplete: 'Vui lòng chấm công đủ tất cả nhân viên trước khi gửi báo cáo.',
  reportConfirm: 'Xác nhận gửi báo cáo quân số Đơn vị cho Admin?',
  sendReportModalTitle: 'Gửi báo cáo quân số',
  today: 'Hôm nay',
  noStaff: 'Không có dữ liệu Nhân viên',
  employees: 'nhân viên',
  headRole: 'Trưởng phòng',
  unlockedBadge: 'Đã mở khóa đặc cách',
  quickActionsColumn: 'CHẤM CÔNG NHANH',
  emptyCell: '—',
  breadcrumbSystem: 'Hệ thống',
  breadcrumbAttendance: 'Chấm công',
  breadcrumbStatistics: 'Thống kê',
  breadcrumbCatalog: 'Danh mục hành chính',
  headCatalog: 'Danh mục hành chính',
  headStaff: 'Nhân viên',
  staffAvatarTitle: 'Cập nhật ảnh đại diện',
  staffAvatarUpdateSuccess: 'Đã cập nhật ảnh đại diện thành công.',
  changePassword: 'Đổi mật khẩu',
  currentPassword: 'Mật khẩu hiện tại',
  newPassword: 'Mật khẩu mới',
  confirmPassword: 'Xác nhận mật khẩu mới',
  updatePassword: 'Cập nhật mật khẩu',
  savingPassword: 'Đang cập nhật...',
  passwordChangeSuccess: 'Đã cập nhật mật khẩu thành công',
  passwordMismatch: 'Xác nhận mật khẩu không khớp',
  passwordMinLength: 'Mật khẩu mới phải có ít nhất 6 ký tự',
};

/** Khóa điều hướng cổng trưởng phòng — dùng thống nhất Sidebar / Dashboard / drawer mobile */
export const HEAD_NAV_IDS = {
  HOME: 'home',
  STATISTICS: 'statistics',
  STAFF: 'staff',
  PASSWORD: 'password',
};

/** Menu trưởng phòng (desktop sidebar) */
export const HEAD_NAV = [
  { id: HEAD_NAV_IDS.HOME, label: 'Chấm công', icon: 'clipboard' },
  { id: HEAD_NAV_IDS.STATISTICS, label: 'Thống kê', icon: 'chart' },
];

export const HEAD_CATALOG_TAB_IDS = [HEAD_NAV_IDS.STAFF];

export const HEAD_CATALOG_NAV = [
  { id: HEAD_NAV_IDS.STAFF, label: 'Nhân viên', icon: 'users' },
];

/** Drawer menu trái — gộp menu chính + danh mục hành chính (mobile trưởng phòng) */
export const HEAD_MOBILE_DRAWER_NAV = [...HEAD_NAV, ...HEAD_CATALOG_NAV];

export const MOBILE_UI = {
  sendReportFull: 'Gửi báo cáo cho Admin',
  staffListTitle: 'Danh sách nhân viên',
  statusLabel: 'Trạng thái',
};

export const ATTENDANCE_PAGE_SIZE = 20;

/** Mobile trưởng phòng — chấm công / nhân viên (card cao, ít bản ghi/trang để có phân trang) */
export const MOBILE_PAGE_SIZE = 5;

/** Mobile trưởng phòng — tải toàn bộ lịch sử trong một lần scroll */
export const MOBILE_HISTORY_FETCH_SIZE = 500;

/** Màn thống kê lịch sử chấm công */
export const STATISTICS_UI = {
  pageTitle: 'THỐNG KÊ LỊCH SỬ CHẤM CÔNG',
  timeRangeLabel: 'Khoảng thời gian',
  dateFromLabel: 'Từ ngày',
  dateToLabel: 'Đến ngày',
  searchPlaceholder: 'Tìm tên nhân viên...',
  applyFilter: 'Áp dụng bộ lọc',
  kpiUnit: 'LƯỢT CHẤM CÔNG',
  chartTitle: 'Xu hướng trạng thái chuyên cần (Theo thời gian)',
  chartLegendPresent: 'ĐI LÀM',
  chartLegendAbsent: 'NGHỈ PHÉP',
  chartLegendStudy: 'ĐI HỌC',
  chartLegendTrip: 'CÔNG TÁC',
  noData: 'Chưa có dữ liệu trong khoảng thời gian đã chọn',
  historyTitle: 'Lịch sử chấm công chi tiết',
  exportExcel: 'Xuất Excel',
  noHistory: 'Không có bản ghi chấm công trong khoảng đã chọn',
  historyExportFilename: 'lich-su-cham-cong.xlsx',
  historyExportSheet: 'Lịch sử chấm công',
  showingResults: (from, to, total) => `Hiển thị ${from}-${to} trên ${total} kết quả`,
  mobilePageTitle: 'Thống kê',
  mobileKpiUnit: 'LƯỢT',
  mobileHistoryTitle: 'Danh sách chi tiết',
  mobileResultsCount: (total) => `${total} kết quả`,
  mobileNotePrefix: 'Ghi chú:',
  mobileMsnvPrefix: 'MSNV:',
};

/** Preset khoảng thời gian — mobile thống kê (mockup pill) */
export const MOBILE_STATISTICS_PRESETS = [
  { value: 'THIS_MONTH', label: 'Tháng này' },
  { value: 'THIS_WEEK', label: 'Tuần này' },
  { value: 'TODAY', label: 'Hôm nay' },
  { value: 'CUSTOM', label: 'Tùy chọn' },
];

export const STATISTICS_HISTORY_COLUMNS = [
  { key: 'date', label: 'NGÀY', align: 'left', width: '14%' },
  { key: 'employee', label: 'NHÂN VIÊN', align: 'left', width: '36%' },
  { key: 'status', label: 'TRẠNG THÁI', align: 'left', width: '22%' },
  { key: 'note', label: 'GHI CHÚ', align: 'left', width: '28%' },
];

export const STATISTICS_HISTORY_EXCEL_HEADERS = ['Ngày', 'Họ và tên', 'Mã số', 'Trạng thái', 'Ghi chú'];

export const STATISTICS_HISTORY_PAGE_SIZE = 10;

export const TIME_RANGE_PRESETS = [
  { value: 'THIS_MONTH', label: 'Tháng này' },
  { value: 'THIS_WEEK', label: 'Tuần này' },
  { value: 'LAST_MONTH', label: 'Tháng trước' },
  { value: 'LAST_30_DAYS', label: '30 ngày qua' },
];

/** Màu biểu đồ thống kê — khớp mockup legend */
export const STATISTICS_CHART_COLORS = {
  diLam: '#2563EB',
  nghiPhep: '#14B8A6',
  diHoc: '#F59E0B',
  diCongTac: '#047857',
};
