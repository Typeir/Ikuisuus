/**
 * @fileoverview Loads and caches the Pagefind browser ESM bundle per locale.
 * @description Loads `/pagefind/{locale}/pagefind.js` via dynamic `import()`,
 * caches one instance per locale, returns typed search/filter methods.
 * @module modules/search/infrastructure/pagefindClient
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * Shape of a raw Pagefind search result before `data()` resolution.
 * A hit is cheap; `data()` is one network fetch per result.
 *
 * @interface PagefindResult
 */
export interface PagefindResult {
  id: string;
  data: () => Promise<PagefindFragment>;
}

/**
 * Shape of a resolved Pagefind result fragment.
 *
 * @interface PagefindFragment
 */
export interface PagefindFragment {
  url: string;
  excerpt: string;
  meta: Record<string, string>;
  filters: Record<string, string[]>;
  raw_url?: string;
  raw_content?: string;
  word_count?: number;
  sub_results?: PagefindSubResult[];
}

/**
 * @interface PagefindSubResult
 */
interface PagefindSubResult {
  url: string;
  excerpt: string;
  title?: string;
}

/**
 * Shape of the Pagefind JS API exposed by the browser bundle.
 */
interface PagefindInstance {
  /** Null term returns all results filtered by options only. */
  search: (
    term: string | null,
    options?: Record<string, unknown>,
  ) => Promise<{
    results: PagefindResult[];
    filters?: Record<string, Record<string, number>>;
    totalFilters?: number;
  }>;
  filters: (
    filter?: Record<string, unknown>,
  ) => Promise<Record<string, Record<string, number>>>;
  options: (opts: Record<string, unknown>) => void;
  preload: (term: string, options?: Record<string, unknown>) => Promise<void>;
  init: () => void;
}

/** Cached Pagefind instances, one per locale. */
const instances = new Map<string, PagefindInstance>();

/** Track in-flight loads to avoid parallel fetches for the same locale. */
const loading = new Map<string, Promise<PagefindInstance>>();

/**
 * Loads and caches the Pagefind ESM bundle for a locale via native `import()`.
 * The bundle is a pure ES module: its API lives on the module namespace,
 * not `window`, and it uses `import.meta` so it cannot load as a classic
 * `<script>` tag.
 *
 * @param {string} locale - Locale code (e.g. 'en')
 * @returns {Promise<PagefindInstance>} Initialised Pagefind instance
 */
async function loadBundle(locale: string): Promise<PagefindInstance> {
  const existing = instances.get(locale);
  if (existing) return existing;

  const pending = loading.get(locale);
  if (pending) return pending;

  const task = (async () => {
    try {
      const mod = (await import(
        /* webpackIgnore: true */ `/pagefind/${locale}/pagefind.js`
      )) as unknown as PagefindInstance;
      mod.init();
      instances.set(locale, mod);
      return mod;
    } finally {
      loading.delete(locale);
    }
  })();

  loading.set(locale, task);
  return task;
}

/**
 * Returns the Pagefind instance for a locale, loading the bundle if needed.
 *
 * SSR-safe — returns `null` when `window` is absent.
 *
 * @param {string} locale - Locale code
 * @returns {Promise<PagefindInstance | null>} Instance or null when not in browser
 */
export async function getPagefind(
  locale: string,
): Promise<PagefindInstance | null> {
  if (typeof window === 'undefined') return null;

  try {
    return await loadBundle(locale);
  } catch (err) {
    console.error('[pagefind] Failed to load bundle:', err);
    return null;
  }
}

/**
 * Searches the Pagefind index for a locale.
 *
 * @param {string} locale - Locale code
 * @param {string} term - Search term
 * @param {Record<string, unknown>} [options] - Pagefind search options
 * @returns {Promise<{ results: PagefindResult[]; filters?: Record<string, Record<string, number>> } | null>}
 */
export async function searchPagefind(
  locale: string,
  term: string,
  options?: Record<string, unknown>,
): Promise<{
  results: PagefindResult[];
  filters?: Record<string, Record<string, number>>;
} | null> {
  /* A filter carries a query on its own: "everything with elemental
     resistance" is a complete question with no words in it. Pagefind takes a
     null term for exactly that, so the length guard applies only when there is
     nothing else to search by. */
  const filters = (options as { filters?: Record<string, string[]> } | undefined)
    ?.filters;
  const hasFilters = Boolean(
    filters && Object.values(filters).some((values) => values.length > 0),
  );

  if (term.length < 2 && !hasFilters) return null;

  const pf = await getPagefind(locale);
  if (!pf) return null;

  try {
    return await pf.search(term.length >= 2 ? term : null, options);
  } catch (err) {
    console.error('[pagefind] Search failed:', err);
    return null;
  }
}

/**
 * Returns available filter values with counts for a locale.
 *
 * @param {string} locale - Locale code
 * @returns {Promise<Record<string, Record<string, number>> | null>} Filters or null
 */
export async function getFilters(
  locale: string,
): Promise<Record<string, Record<string, number>> | null> {
  const pf = await getPagefind(locale);
  if (!pf) return null;

  try {
    return await pf.filters();
  } catch {
    return null;
  }
}
