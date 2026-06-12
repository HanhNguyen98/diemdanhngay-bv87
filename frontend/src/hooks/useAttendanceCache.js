import { useRef, useCallback, useMemo } from 'react';

function cacheKey(deptCode, date) {
  return `${deptCode}|${date}`;
}

/**
 * Cache in-memory theo cặp (deptCode, date) — tránh flash trắng khi đổi ngày/phòng đã xem.
 * Invalidate sau gửi báo cáo hoặc mở khóa để buộc refetch dữ liệu mới.
 *
 * @returns {{ get: Function, set: Function, invalidate: Function }}
 */
export function useAttendanceCache() {
  const store = useRef(new Map());

  const get = useCallback((deptCode, date) => {
    return store.current.get(cacheKey(deptCode, date)) ?? null;
  }, []);

  const set = useCallback((deptCode, date, payload) => {
    store.current.set(cacheKey(deptCode, date), payload);
  }, []);

  const invalidate = useCallback((deptCode, date) => {
    store.current.delete(cacheKey(deptCode, date));
  }, []);

  return useMemo(() => ({ get, set, invalidate }), [get, set, invalidate]);
}
