/**
 * @fileoverview metadataBase URL resolver for the SEO module.
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
 * @param {string} vercelUrl - Raw `VERCEL_URL` value without protocol.
 * @returns {URL} Absolute HTTPS URL for the Vercel deployment.
 */
function fromVercelUrl(vercelUrl: string): URL {
  return new URL(`https://${vercelUrl}`);
}

/**
 * Resolves the `metadataBase` URL for Next.js metadata generation.
 *
 * @returns {URL} Absolute base URL for the current deployment.
 */
export function resolveMetadataBase(): URL {
  if (process.env.SITE_URL) {
    const raw = process.env.SITE_URL;
    return new URL(raw.startsWith('http') ? raw : `https://${raw}`);
  }
  if (process.env.VERCEL_URL) return fromVercelUrl(process.env.VERCEL_URL);
  return new URL(LOCALHOST_FALLBACK);
}
