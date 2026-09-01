/**
 * @fileoverview Helpers for the ISR revalidation endpoint.
 * @description Path decomposition, draft archival, suffix classification of a
 * revalidated path, and the deduplicated metadata sync it triggers.
 *
 * @module app/api/revalidate/revalidateHelpers
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

import { resolveDirectorySource } from '@/lib/db/content/directorySourceResolver';
import { LIBRARY_SEGMENT } from '@/lib/constants/content';
import { draftRepository } from '@/lib/db/content/repositories/draftRepository';
import { logger } from '@/lib/logging/logger';
import { resolveContentType, type ContentType } from '@/lib/metadata/contentTypes';
import { syncMetadata } from '@/lib/metadata/syncService';

const log = logger.child({ module: 'API:Revalidate' });


/**
 * One revalidation target. A bare string is the library path; the object form
 * lets a caller that already parsed the file declare its `contentType`
 * frontmatter, sparing the endpoint a directory listing.
 *
 * @typedef {object} RevalidateTarget
 * @property {string} path - Library path to revalidate
 * @property {string} [contentType] - Declared `contentType` frontmatter value
 */
export interface RevalidateTarget {
  path: string;
  contentType?: string;
}

/**
 * @function extractLocale
 * @description Extracts the locale from a given path. Assumes the locale is the first segment of the path.
 * @param {string} urlPath - The path to extract the locale from (e.g., "/en/library/monsters").
 * @returns {string | null} The extracted locale, or null if no valid locale is found.
 */
export const extractLocale = (urlPath: string): string | null => {
  const parts = urlPath.split('/').filter(Boolean);
  if (parts.length > 0) {
    return parts[0];
  }
  return null;
};

/**
 * @function extractSlugPath
 * @description Extracts the content slug from a full URL path by stripping the
 * locale and /library/ prefix.
 * used by fetchContent (e.g. "items/heirlooms/sacred-heresy").
 * @param {string} urlPath - Full URL path (e.g. "/en/library/items/heirlooms/sacred-heresy")
 * @returns {string} The content slug path without locale or /library/ prefix
 */
export const extractSlugPath = (urlPath: string): string => {
  const parts = urlPath.split('/').filter(Boolean);
  const libraryIndex = parts.indexOf(LIBRARY_SEGMENT);
  if (libraryIndex !== -1) {
    return parts.slice(libraryIndex + 1).join('/');
  }
  return parts.slice(1).join('/');
};

/**
 * @function archiveDraftForPath
 * @description Archives the active draft for a locale+slug pair.
 * @param {string | null} locale - Content locale, or null if extraction failed
 * @param {string} slugPath - Content slug path
 * @returns {Promise<boolean>} True if a draft was archived
 */
export const archiveDraftForPath = async (
  locale: string | null,
  slugPath: string,
): Promise<boolean> => {
  if (!locale || !slugPath) return false;

  try {
    const archived = await draftRepository.archive(locale, slugPath);
    if (archived) {
      log.message('Archived draft after revalidation', {
        locale,
        slug: slugPath,
      });
    }
    return archived;
  } catch (err) {
    log.warning('Failed to archive draft (non-blocking)', {
      locale,
      slug: slugPath,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
};

/**
 * @function classifyByListing
 * @description Resolves the content type of a slug path by listing its parent
 * directory and classifying the matching entry's suffix. A listing is far
 * cheaper than a file read, and stems are unique within a folder, so the first
 * entry whose stem matches the slug decides. Failures are logged, never thrown.
 * @param {string} locale - Content locale
 * @param {string} slugPath - Content slug path, suffix-pruned
 * @returns {Promise<ContentType | null>} The content type, or null when unresolved
 */
export const classifyByListing = async (
  locale: string,
  slugPath: string,
): Promise<ContentType | null> => {
  const cut = slugPath.lastIndexOf('/');
  const parent = cut === -1 ? '' : slugPath.slice(0, cut);
  const stem = slugPath.slice(cut + 1);

  try {
    const entries = await resolveDirectorySource().listEntries(locale, parent);
    for (const entry of entries) {
      if (entry.isDirectory) continue;
      if (!entry.name.startsWith(`${stem}.`)) continue;
      const contentType = resolveContentType(entry.name);
      if (contentType) return contentType;
    }
  } catch (err) {
    log.warning('Failed to classify path by listing (non-blocking)', {
      locale,
      slug: slugPath,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return null;
};

/**
 * @function syncMetadataForLocales
 * @description Runs one hash-based incremental metadata sync per locale for the
 * union of content types touched by this request.
 * @param {Map<string, Set<ContentType>>} byLocale - Content types to sync, keyed by locale
 * @returns {Promise<{ locale: string; contentType: string; status: 'ok' | 'error'; error?: string }[]>} Per-sync outcomes
 */
export const syncMetadataForLocales = async (
  byLocale: Map<string, Set<ContentType>>,
): Promise<
  {
    locale: string;
    contentType: string;
    status: 'ok' | 'error';
    error?: string;
  }[]
> => {
  const outcomes: {
    locale: string;
    contentType: string;
    status: 'ok' | 'error';
    error?: string;
  }[] = [];

  for (const [locale, contentTypes] of byLocale) {
    for (const contentType of contentTypes) {
      try {
        await syncMetadata({ locale, contentTypes: [contentType] });
        log.message('Post-publish metadata sync completed', {
          locale,
          contentType,
        });
        outcomes.push({ locale, contentType, status: 'ok' });
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        log.warning('Post-publish metadata sync failed (non-blocking)', {
          locale,
          contentType,
          error,
        });
        outcomes.push({ locale, contentType, status: 'error', error });
      }
    }
  }

  return outcomes;
};
