/**
 * @fileoverview useMounted Unit Tests
 * @description Tests the mount guard's initial and post-effect values.
 *
 * @module tests/unit/src/lib/hooks/useMounted.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/hooks/useMounted Module under test
 */

import { useMounted } from '@/lib/hooks/useMounted';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('useMounted', () => {
  it('reports mounted after the first client effect', () => {
    const { result } = renderHook(() => useMounted());

    expect(result.current).toBe(true);
  });

  it('reports false on the render before effects run', () => {
    const seen: boolean[] = [];
    renderHook(() => {
      const mounted = useMounted();
      seen.push(mounted);
      return mounted;
    });

    expect(seen[0]).toBe(false);
    expect(seen[seen.length - 1]).toBe(true);
  });
});
