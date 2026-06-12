/** In-memory TTL cache + in-flight dedupe (tránh gọi API trùng khi Strict Mode / remount). */

const store = new Map();
const inflight = new Map();

/**
 * @param {string} key
 * @param {number} ttlMs — 0 = chỉ dedupe in-flight, không lưu cache
 * @param {() => Promise<unknown>} fetcher
 */
export function cachedFetch(key, ttlMs, fetcher) {
  const now = Date.now();

  if (ttlMs > 0) {
    const entry = store.get(key);
    if (entry && entry.expiresAt > now) {
      return Promise.resolve(entry.data);
    }
  }

  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const promise = fetcher()
    .then((data) => {
      if (ttlMs > 0) {
        store.set(key, { data, expiresAt: now + ttlMs });
      }
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise);
  return promise;
}

export function invalidateCache(key) {
  store.delete(key);
  inflight.delete(key);
}

export const CACHE_KEYS = {
  branding: 'public:branding:v2',
  departments: 'attendance:departments',
  session: 'auth:me',
};

export const CACHE_TTL = {
  branding: 5 * 60 * 1000,
  departments: 3 * 60 * 1000,
};
