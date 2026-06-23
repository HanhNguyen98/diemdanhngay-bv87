import { useState, useCallback, useEffect } from 'react';
import { UI, ATTENDANCE_PAGE_SIZE, MOBILE_PAGE_SIZE } from '../constants/attendance';
import { getStaffRegistryFilterDefaults } from '../utils/filterResetDefaults';
import { useHeadStaff } from './useHeadStaff';
import { useFlashMessage } from './useFlashMessage';
import { usePagination } from './usePagination';
import { useIsMobile } from './useIsMobile';

export function useHeadStaffPage() {
  const isMobile = useIsMobile();
  const pageSize = isMobile ? MOBILE_PAGE_SIZE : ATTENDANCE_PAGE_SIZE;
  const { items, stats, loading, initialLoading, refreshing, error, search, setSearch, updateAvatar } = useHeadStaff();
  const { flash, showSuccess, showError, clearFlash } = useFlashMessage();

  const [avatarStaff, setAvatarStaff] = useState(null);

  const { page, totalPages, paginated, goToPage } = usePagination(items, pageSize);

  useEffect(() => {
    goToPage(1);
  }, [search, goToPage]);

  const resetFilters = useCallback(() => {
    setSearch(getStaffRegistryFilterDefaults().search);
  }, [setSearch]);

  const handleSaveAvatar = useCallback(
    async (avatarUrl) => {
      if (!avatarStaff) return;
      try {
        await updateAvatar(avatarStaff.empCode, avatarUrl);
        setAvatarStaff(null);
        showSuccess(UI.staffAvatarUpdateSuccess);
      } catch (err) {
        showError(err.message || UI.staffAvatarUpdateFailed);
        throw err;
      }
    },
    [avatarStaff, updateAvatar, showSuccess, showError],
  );

  return {
    search,
    setSearch,
    resetFilters,
    stats,
    loading,
    initialLoading,
    refreshing,
    error,
    paginated,
    filteredCount: items.length,
    page,
    totalPages,
    pageSize,
    goToPage,
    avatarStaff,
    setAvatarStaff,
    handleSaveAvatar,
    flash,
    clearFlash,
  };
}
