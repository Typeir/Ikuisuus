/**
 * SWR Global Configuration Provider
 *
 * @fileoverview Client-side `SWRConfig` wrapper that establishes project-wide
 * defaults for all SWR data hooks. Inserted in the provider tree between
 * `NextIntlClientProvider` and `PersistentUiProvider` in
 * `ClientProviders.tsx`.
 *
 * @module app/[locale]/SwrProvider
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires swr SWR library for client-side data fetching
 * @requires lib/fetch/fetcher Typed global JSON fetcher
 *
 * @description
 * Global SWR defaults applied here:
 * - `fetcher` — URL-string-based typed JSON fetcher from `lib/fetch/fetcher`
 * - `revalidateOnFocus: false` — avoids unexpected refetches when the user
 *   tabs back to the application
 * - `shouldRetryOnError: false` — errors are surfaced immediately; retries are
 *   opt-in per hook
 * - `dedupingInterval: 5000` — requests with the same key are deduplicated
 *   within a 5-second window
 * - `errorRetryCount: 0` — consistent with `shouldRetryOnError: false`
 *
 * @example
 * // Already mounted in ClientProviders.tsx — no manual setup needed:
 * <SwrProvider>{children}</SwrProvider>
 */

'use client';

import { fetcher } from '@/lib/fetch/fetcher';
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';

/**
 * Props for `<SwrProvider>`.
 *
 * @interface SwrProviderProps
 * @property {ReactNode} children - Child components that can consume SWR hooks
 */
interface SwrProviderProps {
  children: ReactNode;
}

/**
 * Wraps children with a global `SWRConfig` that provides project-wide fetch
 * defaults for all `useSWR` hooks.
 *
 * @component
 * @param {SwrProviderProps} props - Component props
 * @param {ReactNode} props.children - Child components
 * @returns {JSX.Element} SWRConfig-wrapped subtree
 */
export default function SwrProvider({ children }: SwrProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        dedupingInterval: 5000,
        errorRetryCount: 0,
      }}>
      {children}
    </SWRConfig>
  );
}
