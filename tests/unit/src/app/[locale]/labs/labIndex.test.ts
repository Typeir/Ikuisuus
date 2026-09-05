/**
 * @fileoverview Tests for lab route discovery.
 *
 * @module tests/unit/src/app/[locale]/labs/labIndex.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 */

import { describe, expect, it } from 'vitest';
import { labRoutes } from '@/app/[locale]/labs/labIndex';

describe('labRoutes', () => {
  it('finds every lab that has a page', () => {
    const hrefs = labRoutes().map((route) => route.href);
    expect(hrefs).toContain('labs/dev');
    expect(hrefs).toContain('labs/dev/slots');
    expect(hrefs).toContain('labs/dev/buttons');
    expect(hrefs).toContain('labs/dev/deeds');
  });

  it('leaves the index itself out of its own list', () => {
    expect(labRoutes().map((route) => route.href)).not.toContain('labs');
  });

  it('names a lab by its last segment', () => {
    const slots = labRoutes().find((route) => route.href === 'labs/dev/slots');
    expect(slots?.name).toBe('slots');
    expect(slots?.segments).toEqual(['dev', 'slots']);
  });

  it('sorts by route, so the list reads as a tree', () => {
    const hrefs = labRoutes().map((route) => route.href);
    expect(hrefs).toEqual([...hrefs].sort((a, b) => a.localeCompare(b)));
  });
});
