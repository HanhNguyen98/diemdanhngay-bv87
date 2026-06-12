import { useState, useCallback, useEffect, useRef } from 'react';

const AUTO_DISMISS_MS = 4500;

/**
 * Quản lý toast cố định (success / warning / error) với tự ẩn sau 4.5s.
 * Dùng cùng `FlashBanner` — tránh banner inline trong vùng scroll bị khuất trên mobile.
 *
 * @returns {{
 *   flash: { type: 'success'|'warning'|'error', message: string } | null,
 *   showSuccess: (message: string) => void,
 *   showWarning: (message: string) => void,
 *   showError: (message: string) => void,
 *   clearFlash: () => void,
 * }}
 */
export function useFlashMessage() {
  const [flash, setFlash] = useState(null);
  const timerRef = useRef(null);

  const clearFlash = useCallback(() => {
    setFlash(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = useCallback((type, message) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFlash({ type, message });
    timerRef.current = setTimeout(() => {
      setFlash(null);
      timerRef.current = null;
    }, AUTO_DISMISS_MS);
  }, []);

  const showSuccess = useCallback((message) => show('success', message), [show]);
  const showWarning = useCallback((message) => show('warning', message), [show]);
  const showError = useCallback((message) => show('error', message), [show]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return { flash, showSuccess, showWarning, showError, clearFlash };
}
