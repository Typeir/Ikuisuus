/**
 * SWR Global Fetcher
 *
 * @fileoverview Typed HTTP JSON fetcher for use as the SWR global fetcher.
 * Throws {@link FetchError} on non-OK responses.
 *
 * @module lib/fetch/fetcher
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires fetch Browser Fetch API (available in Next.js client and server)
 *
 * @description
 * Default fetcher for SWR hooks. Accepts a URL string or a `[url, RequestInit]` tuple.
 *
 * @example
 * // Used automatically by SWRConfig default fetcher
 * const { data } = useSWR('/api/monsters?locale=en');
 *
 * @example
 * // Used explicitly in hooks that need RequestInit options
 * const { data } = useSWR(
 *   key,
 *   (url) => fetcher<MonsterMetadata[]>(url, { cache: 'no-store' }),
 * );
 */

/**
 * Structured error thrown when an HTTP response status is not in the 2xx range.
 *
 * @class FetchError
 * @property {number} status - HTTP response status code
 * @property {string} statusText - HTTP response status text
 * @property {unknown} body - Parsed response body (JSON when parseable, else plain text)
 * @property {string} url - Request URL that produced the error
 */
export class FetchError extends Error {
  status: number;
  statusText: string;
  body: unknown;
  url: string;

  /**
   * @param {number} status - HTTP status code
   * @param {string} statusText - HTTP status text
   * @param {unknown} body - Parsed error body
   * @param {string} url - Request URL
   */
  constructor(status: number, statusText: string, body: unknown, url: string) {
    super(`HTTP ${status} ${statusText}`);
    this.name = 'FetchError';
    this.status = status;
    this.statusText = statusText;
    this.body = body;
    this.url = url;
  }
}

/**
 * Parses a response body as JSON, falling back to plain text on parse failure.
 *
 * @param {Response} res - HTTP response to parse
 * @returns {Promise<unknown>} Parsed body content
 */
async function parseErrorBody(res: Response): Promise<unknown> {
  try {
    return await res.clone().json();
  } catch {
    return await res.text();
  }
}

/**
 * Resolves a fetcher input value into a `[url, init]` pair.
 *
 * @param {string | [string, RequestInit?]} input - Raw fetcher input
 * @returns {[string, RequestInit | undefined]} Resolved URL and optional request init
 */
function resolveInput(
  input: string | [string, RequestInit?],
): [string, RequestInit | undefined] {
  if (typeof input === 'string') {
    return [input, undefined];
  }
  return [input[0], input[1]];
}

/**
 * Generic JSON fetcher compatible with SWR's fetcher signature.
 *
 * @async
 * @function fetcher
 * @template T - Expected JSON response type
 * @param {string | [string, RequestInit?]} input - Request URL or `[url, RequestInit]` tuple
 * @param {RequestInit} [init] - Optional request init (merged with tuple init when both present)
 * @returns {Promise<T>} Parsed JSON response body
 * @throws {FetchError} When the response status is not in the 2xx range
 *
 * @description
 * Throws {@link FetchError} with the parsed body on non-OK responses.
 *
 * @example
 * const monsters = await fetcher<MonsterMetadata[]>('/api/monsters?locale=en');
 *
 * @example
 * const draft = await fetcher<DraftMetadata>(['/api/drafts?locale=en&slug=foo']);
 */
export async function fetcher<T>(
  input: string | [string, RequestInit?],
  init?: RequestInit,
): Promise<T> {
  const [url, tupleInit] = resolveInput(input);
  const mergedInit = mergeInits(tupleInit, init);
  const res = await (mergedInit !== undefined
    ? fetch(url, mergedInit)
    : fetch(url));
  if (!res.ok) {
    const body = await parseErrorBody(res);
    throw new FetchError(res.status, res.statusText, body, url);
  }
  return (await res.json()) as T;
}

/**
 * Merges two optional `RequestInit` objects, with `override` taking precedence.
 *
 * @param {RequestInit | undefined} base - Base init options
 * @param {RequestInit | undefined} override - Override init options
 * @returns {RequestInit | undefined} Merged init or undefined when both are absent
 */
function mergeInits(
  base: RequestInit | undefined,
  override: RequestInit | undefined,
): RequestInit | undefined {
  if (!base && !override) return undefined;
  return { ...base, ...override };
}
