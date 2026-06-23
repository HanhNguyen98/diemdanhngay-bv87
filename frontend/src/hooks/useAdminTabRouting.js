import { useCallback, useEffect, useState } from 'react';
import {
  ADMIN_DEFAULT_TAB,
  readAdminTabFromUrl,
  writeAdminTabToUrl,
} from '../constants/adminTabs';

/**
 * Sync admin active tab with URL hash (#admin/{tabId}) and preserve state on navigation.
 */
export function useAdminTabRouting() {
  const [activeTab, setActiveTab] = useState(
    () => readAdminTabFromUrl() || ADMIN_DEFAULT_TAB,
  );

  useEffect(() => {
    if (!readAdminTabFromUrl()) {
      writeAdminTabToUrl(activeTab);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- seed hash once on mount

  useEffect(() => {
    const onHashChange = () => {
      const tab = readAdminTabFromUrl();
      if (tab) setActiveTab(tab);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const changeTab = useCallback((tab) => {
    setActiveTab(tab);
    writeAdminTabToUrl(tab);
  }, []);

  return { activeTab, changeTab };
}
