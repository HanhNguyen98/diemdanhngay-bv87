import { useMemo } from 'react';
import { adminApi } from '../services/api';
import { useStaffAttributeCatalog } from './useStaffAttributeCatalog';

const rankApi = {
  list: () => adminApi.listStaffRanks(),
  create: (payload) => adminApi.createStaffRank(payload),
  update: (code, payload) => adminApi.updateStaffRank(code, payload),
  remove: (code) => adminApi.deleteStaffRank(code),
};

const positionApi = {
  list: () => adminApi.listStaffPositions(),
  create: (payload) => adminApi.createStaffPosition(payload),
  update: (code, payload) => adminApi.updateStaffPosition(code, payload),
  remove: (code) => adminApi.deleteStaffPosition(code),
};

export function useStaffRankCatalog() {
  return useStaffAttributeCatalog(useMemo(() => rankApi, []));
}

export function useStaffPositionCatalog() {
  return useStaffAttributeCatalog(useMemo(() => positionApi, []));
}