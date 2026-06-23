/** Global session expiry — triggered on HTTP 401. */
const SESSION_EXPIRED = 'bv87:session-expired';

export function notifySessionExpired() {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED));
}

export function subscribeSessionExpired(handler) {
  window.addEventListener(SESSION_EXPIRED, handler);
  return () => window.removeEventListener(SESSION_EXPIRED, handler);
}
