/**
 * Persistent Storage Utilities
 *
 * @fileoverview Persistent storage helpers with cookie-first source of truth.
 * Cookies are the authoritative layer. sessionStorage and localStorage are fallbacks for regeneration only.
 *
 * @module lib/utils/storePersistentData
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 *
 * @description
 * Multi-layer persistence strategy for UI state:
 *
 * **Storage Layers** (priority order):
 * 1. Cookies - Source of truth, readable server-side for SSR
 * 2. sessionStorage - Tab-scoped fallback, survives refreshes
 * 3. localStorage - Long-term fallback, persists across sessions
 *
 * **Provided Functions**:
 * - `storePersistentData()` - Cookie-first canonical writes
 * - `storePersistentDataCookieFirst()` - Explicit cookie-first writes
 * - `storePersistentDataFallbackOnly()` - Regeneration without cookie override
 * - `storePersistentDataRef()` - Large-payload writes via cookie integrity pointer
 * - `readPersistentDataCookieFirst()` - Cookie-prioritized reads
 * - `fetchPersistentDataRef()` - Large-payload reads with hash verification
 * - `removePersistentData()` - Removes key from all storage layers
 * - `readCookie()` / `writeCookie()` - Low-level cookie operations
 *
 * All functions are SSR-safe (no-ops or null returns when `window` unavailable).
 */

/**
 * Prefix used in cookie values to identify a large-volume data reference.
 * The cookie stores `ref:<hash>` rather than the raw payload.
 *
 * @constant LARGE_VOLUME_REF_PREFIX
 */
const LARGE_VOLUME_REF_PREFIX = 'ref:' as const;

/**
 * Produces a compact 8-character hex content hash using the djb2 algorithm.
 * Not cryptographically secure — used only for integrity checking.
 *
 * @function djb2Hash
 * @param {string} value - The string to hash
 * @returns {string} 8-character lowercase hex string
 */
function djb2Hash(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * @typedef {Object} CookieWriteOptions
 * @property {number} [maxAgeSeconds] Max-Age in seconds.
 * @property {string} [path] Cookie Path attribute.
 * @property {"Lax"|"Strict"|"None"} [sameSite] SameSite attribute.
 */
export type CookieWriteOptions = {
  maxAgeSeconds?: number;
  path?: string;
  sameSite?: 'Lax' | 'Strict' | 'None';
};

const DEFAULT_COOKIE_OPTIONS: Required<CookieWriteOptions> = {
  maxAgeSeconds: 31536000,
  path: '/',
  sameSite: 'Lax',
};

/**
 * Reads a cookie value by name
 *
 * @function readCookie
 * @param {string} key - Cookie name
 * @returns {string | null} Cookie value (decoded) or null if missing / non-browser
 */
export const readCookie = (key: string): string | null => {
  if (typeof document === 'undefined') return null;

  const encodedKey = encodeURIComponent(key);
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const entry of cookies) {
    const eqIndex = entry.indexOf('=');
    const rawName = eqIndex >= 0 ? entry.slice(0, eqIndex) : entry;
    const rawValue = eqIndex >= 0 ? entry.slice(eqIndex + 1) : '';
    if (rawName === encodedKey) {
      try {
        return decodeURIComponent(rawValue);
      } catch {
        return rawValue;
      }
    }
  }

  return null;
};

/**
 * Writes a cookie with the specified value and options
 *
 * @function writeCookie
 * @param {string} key - Cookie name
 * @param {string} value - Cookie value (will be URL-encoded)
 * @param {CookieWriteOptions} [options] - Cookie attributes (maxAgeSeconds, path, sameSite)
 * @returns {void}
 */
export const writeCookie = (
  key: string,
  value: string,
  options?: CookieWriteOptions,
): void => {
  if (typeof document === 'undefined') return;

  const merged: Required<CookieWriteOptions> = {
    ...DEFAULT_COOKIE_OPTIONS,
    ...(options ?? {}),
  };

  const encodedKey = encodeURIComponent(key);
  const encodedValue = encodeURIComponent(value);
  const secureFlag =
    typeof window !== 'undefined' && window.location?.protocol === 'https:'
      ? '; Secure'
      : '';

  document.cookie =
    `${encodedKey}=${encodedValue}` +
    `; Max-Age=${merged.maxAgeSeconds}` +
    `; Path=${merged.path}` +
    `; SameSite=${merged.sameSite}` +
    secureFlag;
};

/**
 * Stores canonical persistent data with cookie as source of truth
 *
 * @function storePersistentDataCookieFirst
 * @param {string} key - Storage key
 * @param {string} value - String value to persist
 * @returns {void}
 *
 * @description
 * Writes to all three storage layers: cookie (canonical), sessionStorage, and localStorage.
 * Use this for authoritative state updates that should be readable server-side.
 */
export const storePersistentDataCookieFirst = (
  key: string,
  value: string,
): void => {
  if (typeof window === 'undefined') return;

  writeCookie(key, value);
  window.sessionStorage?.setItem(key, value);
  window.localStorage?.setItem(key, value);
};

/**
 * Stores fallback persistent data without touching cookies
 *
 * @function storePersistentDataFallbackOnly
 * @param {string} key - Storage key
 * @param {string} value - String value to persist
 * @returns {void}
 *
 * @description
 * Writes to sessionStorage and localStorage only, leaving cookies unchanged.
 * Use for regeneration/repair when cookie is missing or invalid.
 */
export const storePersistentDataFallbackOnly = (
  key: string,
  value: string,
): void => {
  if (typeof window === 'undefined') return;

  window.sessionStorage?.setItem(key, value);
  window.localStorage?.setItem(key, value);
};

/**
 * Reads persistent data with cookie as priority source
 *
 * @function readPersistentDataCookieFirst
 * @param {string} key - Storage key
 * @returns {string | null} Found value or null
 *
 * @description
 * Reads from storage layers in priority order: cookie → sessionStorage → localStorage.
 * Returns the first non-null value found.
 */
export const readPersistentDataCookieFirst = (key: string): string | null => {
  const cookieValue = readCookie(key);
  if (cookieValue != null) return cookieValue;

  if (typeof window === 'undefined') return null;

  const sessionValue = window.sessionStorage?.getItem(key) ?? null;
  if (sessionValue != null) return sessionValue;

  const localValue = window.localStorage?.getItem(key) ?? null;
  return localValue;
};

/**
 * Stores persistent data to all storage layers (alias for storePersistentDataCookieFirst)
 *
 * @function storePersistentData
 * @param {string} key - Storage key
 * @param {string} value - String value to persist
 * @returns {void}
 *
 * @description
 * Backwards-compatible alias for `storePersistentDataCookieFirst`.
 * Writes to cookies, sessionStorage, and localStorage with proper URL encoding.
 */
export const storePersistentData = (key: string, value: string): void => {
  storePersistentDataCookieFirst(key, value);
};

/**
 * Stores large-volume data using a pointer-in-cookie strategy.
 *
 * @function storePersistentDataRef
 * @param {string} key - Storage key
 * @param {string} value - Large string value to persist (e.g. serialised character list)
 * @returns {void}
 *
 * @description
 * Large payloads cannot reliably fit inside a cookie (4 KB limit). This function
 * keeps the cookie as source-of-truth for **integrity** by storing only a short
 * reference pointer `ref:<hash>` in the cookie, while the full payload lives in
 * sessionStorage and localStorage.
 *
 * Read pattern: `fetchPersistentDataRef` reads the cookie pointer, retrieves the
 * payload from fallback storage, recomputes the hash, and returns the value only
 * when the hashes match — guaranteeing referential integrity without stuffing raw
 * data into a cookie.
 *
 * @example
 * storePersistentDataRef('ikuisuus-characters', JSON.stringify(characters));
 * const raw = fetchPersistentDataRef('ikuisuus-characters');
 * const restored = raw ? JSON.parse(raw) : [];
 */
export const storePersistentDataRef = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;

  const hash = djb2Hash(value);
  const pointer = `${LARGE_VOLUME_REF_PREFIX}${hash}`;

  writeCookie(key, pointer);
  window.sessionStorage?.setItem(key, value);
  window.localStorage?.setItem(key, value);
};

/**
 * Retrieves large-volume data stored via `storePersistentDataRef`.
 *
 * @function fetchPersistentDataRef
 * @param {string} key - Storage key
 * @returns {string | null} The original value, or null if the pointer is missing
 * or the hash verification fails
 *
 * @description
 * Read priority:
 * 1. Cookie must contain a valid `ref:<hash>` pointer — returns null otherwise
 * 2. sessionStorage checked first, then localStorage for the payload
 * 3. Hash of retrieved payload is compared against the cookie pointer
 * 4. Returns the payload only when hashes match; null on any mismatch or absence
 *
 * A hash mismatch indicates the storage payload was cleared or tampered with.
 * Callers should treat null as "no valid persisted data" and reinitialise.
 */
export const fetchPersistentDataRef = (key: string): string | null => {
  if (typeof window === 'undefined') return null;

  const cookieValue = readCookie(key);
  if (!cookieValue || !cookieValue.startsWith(LARGE_VOLUME_REF_PREFIX)) {
    return null;
  }

  const expectedHash = cookieValue.slice(LARGE_VOLUME_REF_PREFIX.length);

  const payload =
    window.sessionStorage?.getItem(key) ??
    window.localStorage?.getItem(key) ??
    null;

  if (payload === null) return null;

  const actualHash = djb2Hash(payload);
  return actualHash === expectedHash ? payload : null;
};

/**
 * Removes persistent data from all storage layers.
 *
 * @function removePersistentData
 * @param {string} key - Storage key to remove
 * @returns {void}
 *
 * @description
 * Removes the entry from cookies (by expiring with Max-Age=0),
 * sessionStorage, and localStorage. Safe to call when key is absent.
 * SSR-safe: no-ops when `document`/`window` is unavailable.
 *
 * @example
 * removePersistentData('ikuisuus-active-encounter');
 */
export const removePersistentData = (key: string): void => {
  writeCookie(key, '', { maxAgeSeconds: 0 });
  if (typeof window === 'undefined') return;
  window.sessionStorage?.removeItem(key);
  window.localStorage?.removeItem(key);
};
