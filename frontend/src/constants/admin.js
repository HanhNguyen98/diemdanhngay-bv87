export const ADMIN_UI = {
  portalTitle: 'BỆNH VIỆN QUÂN Y 87',
  portalSubtitle: 'HỆ THỐNG CHẤM CÔNG',
  roleLabel: 'QUẢN TRỊ VIÊN',
  searchPlaceholder: 'Tìm Đơn vị, Nhân viên, vị trí...',
  searchPlaceholderStaff: 'Tìm nhân viên theo tên hoặc mã...',
  searchPlaceholderDepartments: 'Tìm theo tên, mã, vị trí...',
  support: 'Hỗ trợ',
  logout: 'Đăng xuất',
  footer: {
    copyright: '© 2026 BỆNH VIỆN QUÂN Y 87 — Hệ thống Chấm công phát triển bởi Tham mưu - Hành chính',

  },

  bottomPanels: {
    forecast: {
      title: 'Dự báo quân số',
      description: 'Phân tích xu hướng điểm danh và quân số theo Đơn vị.',
      button: 'Phân tích xu hướng',
    },
    tools: {
      title: 'Công cụ quản trị',
      items: ['Báo cáo quân số', 'Nhật ký hệ thống', 'Phân quyền truy cập'],
    },
  },

  dashboard: {
    searchPlaceholder: 'Tìm theo tên ĐƠN VỊ...',
    sendReminder: 'Gửi nhắc nhở',
    progressTitle: 'Tiến độ điểm danh',
    presenceTitle: 'Tỷ lệ hiện diện toàn viện',
    colDept: 'Đơn vị',
    colProgress: 'TIẾN ĐỘ',
    colRate: 'TỶ LỆ',
    colStatus: 'TRẠNG THÁI',
    completed: 'HOÀN THÀNH',
    incomplete: 'CHƯA XONG',
    kpiTotal: 'Tổng quân số',
    kpiPresent: 'Đi làm',
    kpiAbsent: 'Nghỉ phép',
    kpiStudy: 'Đi học',
    kpiDuty: 'Đi công tác',
    chartUnchecked: 'CHƯA CHẤM',
    reminderModalTitle: 'Gửi nhắc nhở chấm công',
    reminderModalHint: 'Chỉ hiển thị các ĐƠN VỊ chưa hoàn thành điểm danh hôm nay.',
    reminderSend: 'Gửi nhắc nhở',
    reminderSelectAll: 'Chọn tất cả',
    actionUnlock: 'Mở khóa chỉnh sửa',
    actionBlockReport: 'Khóa gửi báo cáo',
    actionUnblockReport: 'Mở khóa gửi báo cáo',
    blockReportReason: 'Khóa gửi báo cáo từ bảng điều khiển',
    noIncomplete: 'Tất cả ĐƠN VỊ đã hoàn thành điểm danh.',
    loading: 'Đang tải bảng điều khiển...',
    reminderHistoryTitle: 'Lịch sử gửi nhắc nhở',
    reminderFilterFrom: 'Từ ngày',
    reminderFilterTo: 'Đến ngày',
    reminderApplyFilter: 'Lọc dữ liệu',
    reminderStatsTitle: 'Thống kê theo ĐƠN VỊ',
    reminderStatsTotalLabel: 'Tổng lần nhắc',
    reminderListTitle: 'Lịch sử gửi nhắc nhở',
    reminderStatsColDept: 'ĐƠN VỊ',
    reminderStatsColCount: 'SỐ LẦN NHẮC',
    reminderHistoryColDate: 'NGÀY CHẤM CÔNG',
    reminderHistoryColDept: 'ĐƠN VỊ',
    reminderHistoryColType: 'LOẠI',
    reminderHistoryColTime: 'THỜI GIAN GỬI',
    reminderHistoryEmpty: 'Chưa có lịch sử gửi nhắc nhở.',
    reminderStatsEmpty: 'Chưa có dữ liệu thống kê.',
    reminderTriggerManual: 'Thủ công',
    reminderTriggerAuto: 'Tự động',
    reminderExportExcel: 'Xuất Excel',
    reminderHistoryExportSheet: 'Lịch sử nhắc nhở',
    deptDetailSelectDept: 'Chọn ĐƠN VỊ',
    deptDetailSelectDate: 'Chọn ngày',
    deptDetailApplyFilter: 'Lọc dữ liệu',
    deptDetailExportReport: 'Xuất báo cáo',
    deptDetailLoading: 'Đang tải chi tiết điểm danh...',
    deptDetailEmpty: 'Không có dữ liệu nhân sự trong ngày đã chọn.',
    deptDetailExportSheet: 'Chi tiết điểm danh',
    deptDetailExportFilename: 'chi-tiet-diem-danh.xlsx',
    deptDetailColStaff: 'nhân viên',
    deptDetailColEmpCode: 'MÃ NHÂN VIÊN',
    deptDetailColStatus: 'TRẠNG THÁI',
    deptDetailColNote: 'GHI CHÚ / LÝ DO',
    deptDetailShowing: (from, to, total) =>
      `Hiển thị ${from} - ${to} trên tổng số ${total} nhân viên`,
  },

  nav: {
    dashboard: 'Bảng điều khiển',
    dashboardOverview: 'Tổng quan chung',
    dashboardDeptDetail: 'Chi tiết Đơn vị',
    catalog: 'Danh mục hành chính',
    departments: 'Đơn vị',
    staff: 'Nhân viên',
    utilities: 'Tiện ích',
    reminderHistory: 'Lịch sử gửi nhắc nhở',
    settings: 'Cài đặt',
    settingsSystem: 'Cài đặt hệ thống',
    settingsUsers: 'Phân quyền người dùng',
  },

  settings: {
    system: {
      groupSystemName: 'Tên hệ thống',
      groupBranding: 'Giao diện & thương hiệu',
      groupAttendanceLock: 'Thời gian chốt sổ & nhắc nhở',
      reminderTime: 'Giờ nhắc tự động',
      reminderTimeHint:
        'Hệ thống tự gửi nhắc nhở tới trưởng ban các phòng chưa hoàn thành điểm danh. Admin vẫn có thể gửi thủ công từ bảng điều khiển.',
      reminderTimeRequired: 'Giờ nhắc nhở không được để trống.',
      portalTitle: 'Tên hiển thị',
      logo: 'Logo hệ thống',
      logoSelected: 'Đã chọn logo',
      logoRemove: 'Xóa logo',
      loginAvatar: 'Ảnh nền đăng nhập',
      loginAvatarUpload: 'Tải ảnh nền đăng nhập',
      loginAvatarSelected: 'Đã chọn ảnh nền đăng nhập',
      loginAvatarRemove: 'Xóa ảnh nền đăng nhập',
      lockTime: 'Giờ chốt sổ',
      lockTimeHint:
        'Sau giờ này, trưởng ban không thể chỉnh sửa hoặc gửi báo cáo trên màn chấm công. Admin có thể mở khóa ngày nếu cần.',
      saving: 'Đang lưu...',
      titleRequired: 'Tên hệ thống không được để trống.',
      lockTimeRequired: 'Giờ chốt sổ không được để trống.',
    },
  },

  accounts: {
    newButton: 'Thêm tài khoản',
    searchPlaceholder: 'Tìm tên đăng nhập, họ tên, mã NV, phòng ...',
    active: 'Đang hoạt động',
    inactive: 'Ngưng hoạt động',
    formTitleCreate: 'Thêm tài khoản',
    formTitleEdit: 'Cập nhật tài khoản',
    deleteTitle: 'Xóa tài khoản',
    deleteMessage: (username) =>
      `Bạn có chắc muốn xóa tài khoản "${username}"? Thao tác không thể hoàn tác.`,
    stats: {
      total: 'Tổng tài khoản',
      active: 'Đang hoạt động',
      admin: 'Quản trị viên',
      head: 'Trưởng phòng',
    },
    columns: {
      username: 'TÊN ĐĂNG NHẬP',
      empCode: 'MÃ NV',
      fullname: 'HỌ VÀ TÊN',
      role: 'VAI TRÒ',
      dept: 'Đơn vị',
      status: 'TRẠNG THÁI',
      actions: 'THAO TÁC',
    },
    form: {
      username: 'Tên đăng nhập',
      password: 'Mật khẩu',
      passwordEditHint: 'Để trống nếu không đổi mật khẩu',
      fullname: 'Họ và tên',
      fullnameFromEmployee: 'Họ và tên (theo nhân viên)',
      role: 'Vai trò',
      employee: 'Nhân viên',
      employeeSelectPlaceholder: '— Chọn nhân viên trong danh mục —',
      employeeRequired: 'Vui lòng chọn nhân viên cho tài khoản Trưởng phòng',
      deptFromEmployee: 'Đơn vị (theo nhân viên)',
    },
    resetPasswordTitle: 'Đặt lại mật khẩu',
    resetPasswordDesc: (fullname, username) =>
      `Đặt mật khẩu mới cho tài khoản "${fullname}" (${username}).`,
    resetPasswordConfirm: 'Xác nhận mật khẩu mới',
    resetPasswordSubmit: 'Đặt lại mật khẩu',
    resetPasswordMinLength: 'Mật khẩu mới phải có ít nhất 6 ký tự',
    resetPasswordMismatch: 'Xác nhận mật khẩu không khớp',
    resetPasswordAction: 'Đặt lại MK',
  },

  departments: {
    newButton: 'Thêm Đơn vị',

    filter: 'Bộ lọc',
    stats: {
      totalDepts: 'Tổng Đơn vị',
      totalStaff: 'Tổng Nhân viên',
      avgStaff: 'Quân số TB/Đơn vị',
      efficiency: 'Tỷ lệ hoạt động',
    },
    columns: {
      code: 'MÃ Đơn vị',
      name: 'TÊN Đơn vị',
      location: 'VỊ TRÍ',
      head: 'TRƯỞNG Đơn vị',
      staff: 'QUÂN SỐ',
      actions: 'THAO TÁC',
    },
    formTitleCreate: 'Thêm Đơn vị mới',
    formTitleEdit: 'Cập nhật Đơn vị',
    deleteTitle: 'Xóa Đơn vị',
    deleteMessage: (name) =>
      `Bạn có chắc muốn xóa Đơn vị "${name}"? Thao tác không thể hoàn tác.`,
    locationMapTitle: 'Sơ đồ vị trí',
    locationMapEmpty: 'Chưa có sơ đồ vị trí',
    viewLocationMap: 'Xem sơ đồ vị trí',
  },

  staff: {
    newButton: 'Thêm Nhân viên',
    filter: 'Bộ lọc',
    deptFilterAll: 'Tất cả Đơn vị',
    deptFilterLabel: 'Lọc theo Đơn vị',
    stats: {
      totalStaff: 'Tổng Nhân viên',
      activeStaff: 'Đang hoạt động',
      totalDepts: 'Đơn vị',
      inactive: 'Ngưng hoạt động',
    },
    columns: {
      code: 'MÃ Nhân viên',
      name: 'HỌ VÀ TÊN',
      rank: 'CẤP BẬC',
      position: 'CHỨC VỤ',
      dept: 'Đơn vị',
      status: 'TRẠNG THÁI',
      actions: 'THAO TÁC',
    },
    formTitleCreate: 'Thêm mới Nhân viên',
    formTitleEdit: 'Cập nhật Nhân viên',
    deleteTitle: 'Xóa Nhân viên',
    deleteMessage: (name) =>
      `Bạn có chắc muốn xóa Nhân viên "${name}"? Thao tác không thể hoàn tác.`,
    active: 'Đang hoạt động',
    inactive: 'Ngưng hoạt động',
  },

  form: {
    save: 'Lưu',
    cancel: 'Hủy',
    confirmDelete: 'Xác nhận xóa',
    loadingCode: 'Đang lấy mã...',
    deptCode: 'Mã Đơn vị',
    deptName: 'Tên Đơn vị',
    location: 'Vị trí / Tòa nhà',
    headName: 'Tên TRƯỞNG Đơn vị',
    headSelectPlaceholder: '— Chọn TRƯỞNG Đơn vị —',
    empCode: 'Mã Nhân viên',
    fullname: 'Họ và tên',
    rank: 'Cấp bậc',
    position: 'Chức vụ',
    dept: 'Đơn vị',
    status: 'Trạng thái',
    avatar: 'Ảnh đại diện',
    avatarDropPrefix: 'Kéo thả ảnh vào đây hoặc',
    avatarBrowse: 'chọn tệp',
    avatarDropSuffix: 'để tải lên.',
    avatarFormats: 'JPG, PNG, GIF, WEBP',
    avatarMaxSize: 'Tối đa 5MB',
    avatarSelected: 'Đã chọn ảnh đại diện',
    avatarHint: '',
    avatarRemove: 'Xóa ảnh đại diện',
    locationImage: 'Ảnh sơ đồ vị trí',
    locationImageSelected: 'Đã chọn sơ đồ vị trí',
    locationImageHint: '',
    locationImageRemove: 'Xóa sơ đồ vị trí',
    locationPlaceholder: 'Tòa A, Tầng 2',
    fullnamePlaceholder: 'Nhập họ và tên đầy đủ',
    rankPlaceholder: 'Tìm hoặc chọn cấp bậc...',
    positionPlaceholder: 'Tìm hoặc chọn chức vụ...',
    selectClear: 'Xóa lựa chọn',
    selectEmpty: 'Không tìm thấy kết quả',
  },

  excel: {
    menuLabel: 'Tác vụ Excel',
    template: 'Excel mẫu',
    import: 'Import Excel',
    export: 'Xuất Excel',
    importing: 'Đang import...',
    importSuccess: (count) => `Đã import ${count} bản ghi thành công.`,
    importPartial: (success, fail) =>
      `Import hoàn tất: ${success} thành công, ${fail} lỗi.`,
    importFail: 'Không thể import từ file Excel.',
    importEmpty: 'File Excel không có dòng dữ liệu.',
    importInvalidFile: 'File Excel không đúng định dạng mẫu. Vui lòng Xuất Excel mẫu.',
  },

  loading: 'Đang tải dữ liệu...',
  empty: 'Không có dữ liệu',
  showing: (from, to, total) => `Hiển thị ${from} - ${to} của ${total}`,

  flash: {
    deptCreateSuccess: 'Đã thêm Đơn vị thành công.',
    deptUpdateSuccess: 'Đã cập nhật Đơn vị thành công.',
    deptDeleteSuccess: (name) => `Đã xóa "${name}" thành công.`,
    deptDeleteFail: 'Không thể xóa Đơn vị. Vui lòng thử lại.',
    staffCreateSuccess: 'Đã thêm Nhân viên thành công.',
    staffUpdateSuccess: 'Đã cập nhật Nhân viên thành công.',
    staffDeleteSuccess: (name) => `Đã xóa Nhân viên "${name}" thành công.`,
    staffDeleteFail: 'Không thể xóa Nhân viên. Vui lòng thử lại.',
    settingsSaveSuccess: 'Đã lưu cấu hình hệ thống thành công.',
    accountCreateSuccess: 'Đã thêm tài khoản thành công.',
    accountUpdateSuccess: 'Đã cập nhật tài khoản thành công.',
    accountDeleteSuccess: (username) => `Đã xóa tài khoản "${username}" thành công.`,
    accountDeleteFail: 'Không thể xóa tài khoản. Vui lòng thử lại.',
    accountResetPasswordSuccess: (username) => `Đã đặt lại mật khẩu cho "${username}" thành công.`,
    saveFail: 'Lưu thất bại. Vui lòng kiểm tra lại thông tin.',
  },
};

/** Khóa tab cổng Admin — mirror TAB_COMPONENTS trong AdminApp */
export const ADMIN_TAB_IDS = {
  PASSWORD: 'password',
  DEPARTMENTS: 'departments',
  STAFF: 'staff',
  DASHBOARD_OVERVIEW: 'dashboard-overview',
  DASHBOARD_DEPT_DETAIL: 'dashboard-dept-detail',
  SETTINGS_SYSTEM: 'settings-system',
  SETTINGS_USERS: 'settings-users',
  UTILITIES_REMINDER_HISTORY: 'utilities-reminder-history',
};

export const ADMIN_DEFAULT_TAB = ADMIN_TAB_IDS.DASHBOARD_OVERVIEW;

export const DASHBOARD_TAB_IDS = [
  ADMIN_TAB_IDS.DASHBOARD_OVERVIEW,
  ADMIN_TAB_IDS.DASHBOARD_DEPT_DETAIL,
];

export const CATALOG_TAB_IDS = [ADMIN_TAB_IDS.DEPARTMENTS, ADMIN_TAB_IDS.STAFF];

export const UTILITIES_TAB_IDS = [ADMIN_TAB_IDS.UTILITIES_REMINDER_HISTORY];

export const SETTINGS_TAB_IDS = [ADMIN_TAB_IDS.SETTINGS_SYSTEM, ADMIN_TAB_IDS.SETTINGS_USERS];

/** Submenu Bảng điều khiển */
export const DASHBOARD_NAV = [
  { id: ADMIN_TAB_IDS.DASHBOARD_OVERVIEW, labelKey: 'dashboardOverview' },
  { id: ADMIN_TAB_IDS.DASHBOARD_DEPT_DETAIL, labelKey: 'dashboardDeptDetail' },
];

/** Submenu Danh mục hành chính */
export const CATALOG_NAV = [
  { id: ADMIN_TAB_IDS.DEPARTMENTS, labelKey: 'departments' },
  { id: ADMIN_TAB_IDS.STAFF, labelKey: 'staff' },
];

/** Submenu Tiện ích */
export const UTILITIES_NAV = [
  { id: ADMIN_TAB_IDS.UTILITIES_REMINDER_HISTORY, labelKey: 'reminderHistory' },
];

/** Submenu Cài đặt */
export const SETTINGS_NAV = [
  { id: ADMIN_TAB_IDS.SETTINGS_SYSTEM, labelKey: 'settingsSystem' },
  { id: ADMIN_TAB_IDS.SETTINGS_USERS, labelKey: 'settingsUsers' },
];

/** Cấu hình breadcrumb cho các nhóm submenu */
export const ADMIN_SUBMENU_GROUPS = [
  { parentLabelKey: 'dashboard', tabIds: DASHBOARD_TAB_IDS, items: DASHBOARD_NAV },
  { parentLabelKey: 'catalog', tabIds: CATALOG_TAB_IDS, items: CATALOG_NAV },
  { parentLabelKey: 'utilities', tabIds: UTILITIES_TAB_IDS, items: UTILITIES_NAV },
  { parentLabelKey: 'settings', tabIds: SETTINGS_TAB_IDS, items: SETTINGS_NAV },
];
