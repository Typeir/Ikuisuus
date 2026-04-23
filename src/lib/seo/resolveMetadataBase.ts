/**
 * @fileoverview metadataBase URL resolver for the SEO module.
 *
 * Constructs the absolute base URL used by Next.js to prefix relative
 * metadata paths (og:image, og:url, twitter:image). Resolution order:
 * 1. `SITE_URL` environment variable (production canonical URL).
 * 2. `VERCEL_URL` environment variable (Vercel preview/deployment URL).
 * 3. `http://localhost:3000` development fallback.
 *
 * `SITE_URL` is documented in `.env.example`. `VERCEL_URL` is set
 * automatically by the Vercel platform and does not include a protocol prefix.
 *
 * @module lib/seo/resolveMetadataBase
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

const LOCALHOST_FALLBACK = 'http://localhost:3000';

/**
 * Constructs an absolute URL from the `VERCEL_URL` environment variable.
 *
 * Vercel sets this variable without a protocol prefix, so `https://` is
 * prepended automatically.
 *
 * @param {string} vercelUrl - Raw `VERCEL_URL` value without protocol.
 * @returns {URL} Absolute HTTPS URL for the Vercel deployment.
 */
function fromVercelUrl(vercelUrl: string): URL {
  return new URL(`https://${vercelUrl}`);
}

/**
 * Resolves the `metadataBase` URL for Next.js metadata generation.
 *
 * Tries `SITE_URL`, then `VERCEL_URL`, then falls back to localhost.
 * This value is exported as `metadataBase` in the root layout so all
 * relative paths in `Metadata` objects are automatically made absolute.
 *
 * @returns {URL} Absolute base URL for the current deployment.
 */
export function resolveMetadataBase(): URL {
  if (process.env.SITE_URL) return new URL(process.env.SITE_URL);
  if (process.env.VERCEL_URL) return fromVercelUrl(process.env.VERCEL_URL);
  return new URL(LOCALHOST_FALLBACK);
}
