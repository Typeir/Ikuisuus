/**
 * @fileoverview Directory Source Resolver
 * @description Resolves the active DirectorySourceAdapter based on runtime
 * environment. Uses filesystem during development/build and GitHub at
 * production runtime for content revalidation.
 *
 * @module lib/db/content/directorySourceResolver
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import 'server-only';

import { fsDirectorySource } from './adapters/fs/fsDirectorySource';
import { githubDirectorySource } from './adapters/github/githubDirectorySource';
import type { DirectorySourceAdapter } from './directorySourceAdapter';

/**
 * Determines whether filesystem directory reads should be used.
 *
 * @returns {boolean} True when development/build should prefer filesystem reads
 */
const shouldUseFilesystemDirectorySource = (): boolean => {
  if (process.env.CONTENT_FETCH_MODE === 'runtime') return false;
  if (process.env.CONTENT_FETCH_MODE === 'build') return true;
  if (process.env.NODE_ENV === 'development') return true;

  const phase = process.env.NEXT_PHASE;
  return (
    phase === 'phase-production-build' || phase === 'phase-development-server'
  );
};

/**
 * Resolves the active directory source adapter.
 *
 * @returns {DirectorySourceAdapter} Filesystem or GitHub directory source adapter
 */
export const resolveDirectorySource = (): DirectorySourceAdapter => {
  return shouldUseFilesystemDirectorySource()
    ? fsDirectorySource
    : githubDirectorySource;
};
