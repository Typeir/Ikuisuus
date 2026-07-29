/**
 * @fileoverview Link wrapper that defers prefetch until hover intent.
 * @description Prevents ISR write spam from viewport-triggered prefetch on
 * large link lists (spell tables, sidebar navigation). Defaults to no prefetch
 * and enables `prefetch={null}` (static prefetch) on `onMouseEnter`.
 *
 * @module lib/components/lazyPrefetchLink/LazyPrefetchLink
 * @author Typeir
 * @version 1.0.0
 * @since 2026-07-09
 */

'use client';

import Link from 'next/link';
import type { JSX, ComponentProps } from 'react';
import { useState } from 'react';

/**
 * Props mirror Next.js `Link` props exactly, minus `prefetch` which is
 * managed internally.
 */
type LazyPrefetchLinkProps = Omit<ComponentProps<typeof Link>, 'prefetch'>;

/**
 * Link that only prefetches when the user hovers, not when the link enters
 * the viewport. This avoids massive ISR write amplification on pages with
 * hundreds of links (e.g. spell tables, navigation trees).
 *
 * @component
 * @param {LazyPrefetchLinkProps} props - Standard Next.js Link props (prefetch is managed internally).
 * @returns {JSX.Element} Next.js Link with hover-triggered prefetch.
 */
export function LazyPrefetchLink(props: LazyPrefetchLinkProps): JSX.Element {
  const [active, setActive] = useState(false);

  return (
    <Link
      {...props}
      prefetch={active ? null : false}
      onMouseEnter={(e) => {
        setActive(true);
        props.onMouseEnter?.(e);
      }}
    />
  );
}
