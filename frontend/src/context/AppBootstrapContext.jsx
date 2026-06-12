import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ADMIN_UI } from '../constants/admin';
import { publicApi } from '../api/public';
import { api } from '../api/client';
import {
  CACHE_KEYS,
  CACHE_TTL,
  cachedFetch,
  invalidateCache,
} from '../api/queryCache';
import { syncFavicon } from '../utils/documentBranding';

const LEGACY_PORTAL_TITLE = 'Bệnh viện Quân y 87';

function normalizePortalTitle(title) {
  if (!title || title === LEGACY_PORTAL_TITLE) {
    return ADMIN_UI.portalTitle;
  }
  return title;
}

const defaultBranding = {
  portalTitle: ADMIN_UI.portalTitle,
  logoUrl: null,
  loginAvatarUrl: null,
};

const AppBootstrapContext = createContext(null);

export function AppBootstrapProvider({ children }) {
  const [branding, setBranding] = useState(defaultBranding);
  const [brandingLoading, setBrandingLoading] = useState(true);
  const brandingBootstrappedRef = useRef(false);

  const loadBranding = useCallback(async (force = false) => {
    if (force) {
      invalidateCache(CACHE_KEYS.branding);
    }
    try {
      const data = await cachedFetch(CACHE_KEYS.branding, CACHE_TTL.branding, () =>
        publicApi.getBranding(),
      );
      setBranding({
        portalTitle: normalizePortalTitle(data.portalTitle),
        logoUrl: data.logoUrl || null,
        loginAvatarUrl: data.loginAvatarUrl || null,
      });
    } catch {
      setBranding(defaultBranding);
    } finally {
      setBrandingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (brandingBootstrappedRef.current) return;
    brandingBootstrappedRef.current = true;
    loadBranding();
  }, [loadBranding]);

  useEffect(() => {
    syncFavicon(branding.logoUrl);
  }, [branding.logoUrl]);

  const reloadBranding = useCallback(() => loadBranding(true), [loadBranding]);

  const fetchAttendanceDepartments = useCallback(async (force = false) => {
    if (force) {
      invalidateCache(CACHE_KEYS.departments);
    }
    return cachedFetch(CACHE_KEYS.departments, CACHE_TTL.departments, () => api.getDepartments());
  }, []);

  const value = useMemo(
    () => ({
      branding,
      brandingLoading,
      reloadBranding,
      fetchAttendanceDepartments,
    }),
    [branding, brandingLoading, reloadBranding, fetchAttendanceDepartments],
  );

  return <AppBootstrapContext.Provider value={value}>{children}</AppBootstrapContext.Provider>;
}

export function useAppBootstrap() {
  const context = useContext(AppBootstrapContext);
  if (!context) {
    throw new Error('useAppBootstrap must be used within AppBootstrapProvider');
  }
  return context;
}

/** Kiểm tra phiên đăng nhập — dedupe in-flight, không cache lâu. */
export async function fetchSessionUser() {
  return cachedFetch(CACHE_KEYS.session, 0, () => api.me());
}

export function clearSessionCache() {
  invalidateCache(CACHE_KEYS.session);
}
