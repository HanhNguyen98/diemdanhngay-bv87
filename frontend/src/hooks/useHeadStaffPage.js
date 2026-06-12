import { useState, useCallback, useEffect, useMemo } from 'react';
import { UI, ATTENDANCE_PAGE_SIZE, MOBILE_PAGE_SIZE } from '../constants/attendance';
import { useHeadStaff } from './useHeadStaff';
import { useFlashMessage } from './useFlashMessage';
import { usePagination } from './usePagination';
import { useIsMobile } from './useIsMobile';

export function useHeadStaffPage() {
  const isMobile = useIsMobile();
  const pageSize = isMobile ? MOBILE_PAGE_SIZE : ATTENDANCE_PAGE_SIZE;
  const { items, stats, loading, error, search, setSearch, updateAvatar } = useHeadStaff();
  const { flash, showSuccess, showError, clearFlash } = useFlashMessage();

  const [avatarStaff, setAvatarStaff] = useState(null);
  const [viewStaff, setViewStaff] = useState(null);

  const filtered = useMemo(() => items, [items]);

  const { page, totalPages, paginated, goToPage } = usePagination(filtered, pageSize);

  useEffect(() => {
    goToPage(1);
  }, [search, goToPage]);

  const handleSaveAvatar = useCallback(
    async (avatarUrl) => {
      if (!avatarStaff) return;
      try {
        await updateAvatar(avatarStaff.empCode, avatarUrl);
        setAvatarStaff(null);
        showSuccess(UI.staffAvatarUpdateSuccess);
      } catch (err) {
        showError(err.message || 'Không thể cập nhật ảnh đại diện.');
        throw err;
      }
    },
    [avatarStaff, updateAvatar, showSuccess, showError],
  );

  return {
    search,
    setSearch,
    stats,
    loading,
    error,
    filtered,
    paginated,
    filteredCount: filtered.length,
    page,
    totalPages,
    pageSize,
    goToPage,
    avatarStaff,
    setAvatarStaff,
    viewStaff,
    setViewStaff,
    handleSaveAvatar,
    flash,
    clearFlash,
  };
}
