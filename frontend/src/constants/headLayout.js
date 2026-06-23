import { UI } from './attendance';

/** Mobile breadcrumb strip — spacing chuẩn (màn Thống kê). */
export const HEAD_MOBILE_BREADCRUMB_CLASS =
  'lg:hidden shrink-0 border-b border-line bg-surface-page px-[clamp(0.75rem,3vw,1.25rem)] py-2.5 min-w-0';

/** Main content padding/gap — đồng bộ 3 màn HEAD. */
export const HEAD_MAIN_CLASS =
  'max-lg:space-y-4 px-[clamp(0.75rem,3vw,1.25rem)] py-[clamp(0.75rem,2vw,1rem)] max-lg:pb-24 lg:flex lg:flex-col lg:gap-[clamp(0.75rem,2vw,1rem)] lg:flex-1 lg:min-h-0 lg:px-5 lg:py-5';

/** Điểm danh desktop: main cần overflow hidden cho bảng. */
export const HEAD_ATTENDANCE_MAIN_CLASS = `${HEAD_MAIN_CLASS} lg:overflow-hidden lg:[&>*]:shrink-0`;

/** Thống kê / nhân viên desktop: scroll dọc. */
export const HEAD_SCROLL_MAIN_CLASS = `${HEAD_MAIN_CLASS} lg:overflow-y-auto lg:overscroll-y-contain lg:[&>*]:shrink-0`;

/**
 * Breadcrumb HEAD: Hệ thống > [màn] > tên ban khoa/phòng.
 * @param {string} pageLabel
 * @param {string} [deptName]
 */
export function buildHeadBreadcrumb(pageLabel, deptName) {
  return [
    { label: UI.breadcrumbSystem },
    { label: pageLabel },
    { label: deptName?.trim() || '...' },
  ];
}
