import { useState, useCallback, useEffect } from 'react';
import { adminApi } from '../services/api';

/**
 * Loads active staff rank and position names for forms and Excel import validation.
 */
export function useStaffCatalogOptions() {
  const [rankNames, setRankNames] = useState([]);
  const [positionNames, setPositionNames] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ranks, positions] = await Promise.all([
        adminApi.listStaffRanks(),
        adminApi.listStaffPositions(),
      ]);
      setRankNames(ranks.filter((item) => item.active).map((item) => item.rankName));
      setPositionNames(
        positions.filter((item) => item.active).map((item) => item.positionName),
      );
    } catch {
      setRankNames([]);
      setPositionNames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { rankNames, positionNames, loading, reload: load };
}
