import { useState, useMemo, useEffect, useCallback } from 'react';

/**
 * Phân trang client-side cho danh sách đã load sẵn (staff, accounts, departments…).
 * Tự kéo `page` về phạm vi hợp lệ khi bộ lọc làm giảm số trang.
 *
 * @param {unknown[]} items - Mảng đã lọc cần phân trang
 * @param {number} [pageSize=4] - Số phần tử mỗi trang
 * @returns {{ page: number, totalPages: number, paginated: unknown[], pageSize: number, goToPage: (n: number) => void }}
 */
export function usePagination(items, pageSize = 4) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginated = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  const goToPage = useCallback(
    (next) => {
      setPage((current) => Math.min(Math.max(1, next), totalPages));
    },
    [totalPages],
  );

  return { page, totalPages, paginated, pageSize, goToPage };
}

/**
 * Sinh dãy số trang kèm ellipsis cho `DesktopPagination` / `MobilePagination`.
 *
 * @param {number} page - Trang hiện tại (1-based)
 * @param {number} totalPages - Tổng số trang
 * @returns {(number|string)[]} Ví dụ: [1, '…', 4, 5, 6, '…', 12]
 */
export function buildPageRange(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push('…');
    }
    result.push(sorted[i]);
  }
  return result;
}
