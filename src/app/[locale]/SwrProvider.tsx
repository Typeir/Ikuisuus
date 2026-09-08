/**
 * @fileoverview Client-side `SWRConfig` wrapper setting project-wide SWR
 * defaults.
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
 * Applied defaults
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
 * @property {ReactNode} children - Child components consuming SWR hooks
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
        revalidateIfStale: false,
        shouldRetryOnError: false,
        dedupingInterval: 5000,
        errorRetryCount: 0,
      }}>
      {children}
    </SWRConfig>
  );
}
