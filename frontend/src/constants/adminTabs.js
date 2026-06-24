/** Khóa tab cổng Admin — mirror TAB_COMPONENTS trong AdminApp */
export const ADMIN_TAB_IDS = {
  PASSWORD: 'password',
  DEPARTMENTS: 'departments',
  STAFF: 'staff',
  STAFF_RANKS: 'staff-ranks',
  STAFF_POSITIONS: 'staff-positions',
  STATUS_CATALOG: 'status-catalog',
  DASHBOARD_OVERVIEW: 'dashboard-overview',
  DASHBOARD_DEPT_DETAIL: 'dashboard-dept-detail',
  SETTINGS_SYSTEM: 'settings-system',
  SETTINGS_USERS: 'settings-users',
  UTILITIES_REMINDER_HISTORY: 'utilities-reminder-history',
};

export const ADMIN_DEFAULT_TAB = ADMIN_TAB_IDS.DASHBOARD_OVERVIEW;

/** Tabs giữ mount ẩn để bảo toàn bộ lọc/phân trang khi chuyển tab */
export const ADMIN_CACHEABLE_TAB_IDS = new Set([
  ADMIN_TAB_IDS.DEPARTMENTS,
  ADMIN_TAB_IDS.STAFF,
]);

export const ADMIN_HASH_PREFIX = '#admin/';

/** Mobile admin — tiến độ điểm danh theo ĐƠN VỊ (card + phân trang) */
export const MOBILE_DEPT_PROGRESS_PAGE_SIZE = 10;
export const DESKTOP_DEPT_PROGRESS_PAGE_SIZE = 20;

/** Phân trang mobile (ADMIN) — không có nền thanh, giống màn Đơn vị mobile */
export const MOBILE_TABLE_PAGINATION_BAR_CLASS = 'py-2';

/** Phân trang mobile trong RegistryTableShell (ẩn trên desktop) */
export const MOBILE_REGISTRY_PAGINATION_CLASS =
  `lg:hidden ${MOBILE_TABLE_PAGINATION_BAR_CLASS}`;

/** Padding dưới main mobile — tránh FAB AI che phân trang */
export const MOBILE_SHELL_BOTTOM_PADDING_CLASS = 'max-lg:pb-28';

export const DASHBOARD_TAB_IDS = [
  ADMIN_TAB_IDS.DASHBOARD_OVERVIEW,
  ADMIN_TAB_IDS.DASHBOARD_DEPT_DETAIL,
];

export const CATALOG_TAB_IDS = [
  ADMIN_TAB_IDS.DEPARTMENTS,
  ADMIN_TAB_IDS.STAFF,
  ADMIN_TAB_IDS.STAFF_RANKS,
  ADMIN_TAB_IDS.STAFF_POSITIONS,
  ADMIN_TAB_IDS.STATUS_CATALOG,
];

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
  { id: ADMIN_TAB_IDS.STAFF_RANKS, labelKey: 'staffRanks' },
  { id: ADMIN_TAB_IDS.STAFF_POSITIONS, labelKey: 'staffPositions' },
  { id: ADMIN_TAB_IDS.STATUS_CATALOG, labelKey: 'statusCatalog' },
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

const VALID_TAB_IDS = new Set(Object.values(ADMIN_TAB_IDS));

export function isValidAdminTab(tab) {
  return VALID_TAB_IDS.has(tab);
}

export function readAdminTabFromUrl() {
  const hash = window.location.hash;
  if (!hash.startsWith(ADMIN_HASH_PREFIX)) return null;
  const tab = hash.slice(ADMIN_HASH_PREFIX.length).split('?')[0];
  return isValidAdminTab(tab) ? tab : null;
}

export function writeAdminTabToUrl(tab) {
  const nextHash = `${ADMIN_HASH_PREFIX}${tab}`;
  if (window.location.hash !== nextHash) {
    window.history.replaceState(null, '', nextHash);
  }
}
