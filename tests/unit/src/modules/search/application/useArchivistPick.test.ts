/**
 * @fileoverview useArchivistPick Hook Unit Tests
 * @module tests/unit/src/modules/search/application/useArchivistPick.test
 */

import { useArchivistPick } from '@/modules/search/application/useArchivistPick';
import { FEATURED_PAGES } from '@/modules/search/domain/featuredPages';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('useArchivistPick', () => {
  it('should return a featured page after mount', () => {
    const { result } = renderHook(() => useArchivistPick());
    /* The pick is computed in an effect, which renderHook flushes via act. */
    expect(result.current).not.toBeNull();
    expect(FEATURED_PAGES).toContain(result.current);
  });
});
