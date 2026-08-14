/**
 * @fileoverview Resolves the OG image path for a content page.
 *
 * Priority chain: explicit frontmatter path → slug-derived public file across
 * multiple extensions → slug-derived `.webp` candidate for CDN-served images.
 * Performs filesystem checks only.
 *
 * @module lib/seo/resolvePageImage
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import fs from 'fs';
import path from 'path';

import { getPublicFolder } from '../utils/getPublicFolder';

const IMAGE_EXTENSIONS = ['.webp', '.png', '.jpg', '.jpeg'] as const;

/**
 * Checks whether a root-relative path exists under the `public/` directory.
 * Returns false on filesystem error.
 *
 * @param {string} relativePath - Root-relative path starting with `/`.
 * @returns {boolean} True when the file exists on the local filesystem.
 */
function publicFileExists(relativePath: string): boolean {
  try {
    const absolute = path.join(
      getPublicFolder(),
      relativePath.replace(/^\//, ''),
    );
    return fs.existsSync(absolute);
  } catch {
    return false;
  }
}

/**
 * Derives the content-type image folder from a slug path.
 *
 * The type folder is the directory immediately containing the file, e.g.
 * `"items/heirlooms/dreaded-defender"` → `"heirlooms"`.
 *
 * @param {string} slugPath - Slash-separated content path.
 * @returns {string} Inferred image type folder name.
 */
function inferTypeFolder(slugPath: string): string {
  const parts = slugPath.split('/');
  return parts.length >= 2 ? parts[parts.length - 2] : 'images';
}

/**
 * Constructs the candidate base image path (without extension) for a slug.
 *
 * @param {string} slugPath - Slash-separated content path.
 * @returns {string} Root-relative image base path, e.g. `/library/images/heirlooms/dreaded-defender`.
 */
function buildCandidateBasePath(slugPath: string): string {
  const parts = slugPath.split('/');
  const name = parts[parts.length - 1];
  const typeFolder = inferTypeFolder(slugPath);
  return `/library/images/${typeFolder}/${name}`;
}

/**
 * Returns the first image path that exists under `public/`, trying each
 * supported extension in priority order (webp → png → jpg → jpeg).
 *
 * @param {string} basePath - Root-relative image path without extension.
 * @returns {string | null} Matching path with extension, or null if none found.
 */
function findFirstExistingImage(basePath: string): string | null {
  for (const ext of IMAGE_EXTENSIONS) {
    const candidate = `${basePath}${ext}`;
    if (publicFileExists(candidate)) return candidate;
  }
  return null;
}

/**
 * Resolves the OG image path for a content page.
 *
 * Priority order:
 * 1. Explicit frontmatter `image` value.
 * 2. First matching extension found under `public/library/images/`.
 * 3. Slug-derived `.webp` candidate path (assumed to be served from CDN
 *    when not present on the local build filesystem).
 *
 * @param {string | undefined} frontmatterImage - Image path from MDX frontmatter, if any.
 * @param {string} slugPath - Slash-separated content path.
 * @returns {string} Resolved root-relative image path.
 */
export function resolvePageImage(
  frontmatterImage: string | undefined,
  slugPath: string,
): string {
  if (frontmatterImage) return frontmatterImage;

  const basePath = buildCandidateBasePath(slugPath);
  return findFirstExistingImage(basePath) ?? `${basePath}.webp`;
}
