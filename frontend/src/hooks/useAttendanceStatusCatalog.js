import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { buildStatusConfig } from '../utils/statusCatalog';

export function useAttendanceStatusCatalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getAttendanceStatusTypes()
      .then((data) => {
        if (!cancelled) {
          setItems(data);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setItems([]);
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const config = useMemo(() => buildStatusConfig(items), [items]);

  return {
    items,
    loading,
    error,
    ...config,
  };
}
