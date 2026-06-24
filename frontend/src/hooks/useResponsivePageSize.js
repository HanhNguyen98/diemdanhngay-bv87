import { ATTENDANCE_PAGE_SIZE, MOBILE_PAGE_SIZE } from '../constants/attendance';
import { useIsMobile } from './useIsMobile';

/**
 * Standard list page size: 10 on mobile (max-lg), 20 on desktop.
 * @returns {number}
 */
export function useResponsivePageSize() {
  const isMobile = useIsMobile();
  return isMobile ? MOBILE_PAGE_SIZE : ATTENDANCE_PAGE_SIZE;
}
