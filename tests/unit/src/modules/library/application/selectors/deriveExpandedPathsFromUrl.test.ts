/**
 * Tests for deriveExpandedPathsFromUrl utility
 *
 * @fileoverview Unit tests for URL-based sidebar expansion derivation.
 * Tests pathname parsing and ancestor path generation.
 */

import { deriveExpandedPathsFromUrl } from '@/modules/library/application/selectors/deriveExpandedPathsFromUrl';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('deriveExpandedPathsFromUrl', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock window.location
    delete (window as any).location;
    (window as any).location = { pathname: '' };
  });

  afterEach(() => {
    // Restore original location
    (window as any).location = originalLocation;
  });

  it('should return empty array for homepage', () => {
    window.location.pathname = '/en';
    const result = deriveExpandedPathsFromUrl();
    expect(result).toEqual([]);
  });

  it('should return empty array for non-library paths', () => {
    window.location.pathname = '/en/about';
    const result = deriveExpandedPathsFromUrl();
    expect(result).toEqual([]);
  });

  it('should derive single-level path', () => {
    window.location.pathname = '/en/library/monsters';
    const result = deriveExpandedPathsFromUrl();
    expect(result).toEqual(['monsters']);
  });

  it('should derive multi-level path with ancestors', () => {
    window.location.pathname = '/en/library/monsters/dragons/ancient-red-dragon';
    const result = deriveExpandedPathsFromUrl();
    expect(result).toEqual([
      'monsters',
      'monsters/dragons',
      'monsters/dragons/ancient-red-dragon'
    ]);
  });

  it('should handle paths with .sheet extension', () => {
    window.location.pathname = '/en/library/monsters/albedo.sheet';
    const result = deriveExpandedPathsFromUrl();
    expect(result).toEqual(['monsters', 'monsters/albedo']);
  });

  it('should handle items/heirlooms nested path', () => {
    window.location.pathname = '/en/library/items/heirlooms/sunblade';
    const result = deriveExpandedPathsFromUrl();
    expect(result).toEqual([
      'items',
      'items/heirlooms',
      'items/heirlooms/sunblade'
    ]);
  });

  it('should handle Spanish locale', () => {
    window.location.pathname = '/es/library/monsters/ancient-red-dragon';
    const result = deriveExpandedPathsFromUrl();
    expect(result).toEqual([
      'monsters',
      'monsters/ancient-red-dragon'
    ]);
  });

  it('should handle Finnish locale', () => {
    window.location.pathname = '/fi/library/spells/fireball';
    const result = deriveExpandedPathsFromUrl();
    expect(result).toEqual([
      'spells',
      'spells/fireball'
    ]);
  });

  it('should return empty array for SSR (window undefined)', () => {
    const windowSpy = global.window;
    (global as any).window = undefined;
    
    const result = deriveExpandedPathsFromUrl();
    expect(result).toEqual([]);
    
    (global as any).window = windowSpy;
  });
});
