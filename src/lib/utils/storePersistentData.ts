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
 * - `readPersistentDataCookieFirst()` - Cookie-prioritized reads
 * - `readCookie()` / `writeCookie()` - Low-level cookie operations
 *
 * All functions are SSR-safe (no-ops or null returns when `window` unavailable).
 */

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
  options?: CookieWriteOptions
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
  value: string
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
  value: string
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
