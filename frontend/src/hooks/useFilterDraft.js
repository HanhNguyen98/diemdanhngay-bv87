import { useCallback, useEffect, useState } from 'react';

/**
 * Giữ bản nháp bộ lọc mobile tách khỏi giá trị đã áp dụng; đồng bộ khi applied đổi từ bên ngoài.
 */
export function useFilterDraft(applied) {
  const [draft, setDraft] = useState(applied);
  const appliedKey = JSON.stringify(applied);

  useEffect(() => {
    setDraft(applied);
  }, [appliedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const patchDraft = useCallback((updater) => {
    setDraft((prev) => (typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }));
  }, []);

  return { draft, setDraft, patchDraft };
}
