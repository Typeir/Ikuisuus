/**
 * Mounted Guard
 *
 * @fileoverview Client-mount guard: false during SSR and hydration render,
 * true after the first client effect.
 *
 * @module lib/hooks/useMounted
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * Returns false until the component has mounted on the client.
 *
 * @returns {boolean} True after the first client effect
 *
 * @example
 * const mounted = useMounted();
 * if (!mounted) return null;
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
