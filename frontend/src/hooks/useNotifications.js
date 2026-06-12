import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

const POLL_MS = 60000;

export function useNotifications({ enabled = true, onAttendanceNavigate } = {}) {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const [list, countRes] = await Promise.all([
        api.getNotifications(),
        api.getUnreadNotificationCount(),
      ]);
      setItems(list);
      setUnreadCount(countRes.count || 0);
    } catch {
      /* ignore poll errors */
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleOpen = useCallback(() => {
    setOpen((v) => !v);
    if (!open) {
      setLoading(true);
      refresh().finally(() => setLoading(false));
    }
  }, [open, refresh]);

  const handleItemClick = useCallback(
    async (item) => {
      try {
        if (!item.read) {
          await api.markNotificationRead(item.id);
        }
        setOpen(false);
        await refresh();
        if (item.type === 'ATTENDANCE_REMINDER' && item.attendanceDate && onAttendanceNavigate) {
          onAttendanceNavigate(item.attendanceDate);
        }
      } catch {
        /* keep UI responsive */
      }
    },
    [onAttendanceNavigate, refresh],
  );

  return {
    items,
    unreadCount,
    open,
    loading,
    rootRef,
    handleOpen,
    handleItemClick,
    refresh,
  };
}
