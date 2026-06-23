/** FAB anchor insets from viewport edges (px). */
export const AI_FAB_INSETS = {
  admin: { right: 24, bottom: 24 },
  head: { right: 16, bottomDesktop: 24, bottomMobile: 96 },
};

export const AI_FAB_STORAGE_KEYS = {
  admin: 'bv87-ai-fab-admin',
  head: 'bv87-ai-fab-head',
};

const LG_BREAKPOINT = 1024;

function isMobileViewport() {
  return typeof window !== 'undefined' && window.innerWidth < LG_BREAKPOINT;
}

/** @returns {{ right: number, bottom: number }} */
export function getAdminAiFabInsets() {
  return { ...AI_FAB_INSETS.admin };
}

/** @returns {{ right: number, bottom: number }} */
export function getHeadAiFabInsets() {
  const { right, bottomDesktop, bottomMobile } = AI_FAB_INSETS.head;
  return {
    right,
    bottom: isMobileViewport() ? bottomMobile : bottomDesktop,
  };
}

/** @deprecated Use getAdminAiFabInsets — kept for call-site compatibility. */
export function getAdminAiFabDefaultPosition() {
  return getAdminAiFabInsets();
}

/** @deprecated Use getHeadAiFabInsets — kept for call-site compatibility. */
export function getHeadAiFabDefaultPosition() {
  return getHeadAiFabInsets();
}
