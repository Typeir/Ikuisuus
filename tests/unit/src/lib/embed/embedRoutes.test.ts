/**
 * @fileoverview Embed Route Vocabulary Tests
 * @description Tests detection and pathname rewriting between library and
 * embed route trees. Asserts prefix near-misses are rejected.
 *
 * @module tests/unit/src/lib/embed/embedRoutes
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
  buildEmbedUrl,
  isEmbedPathname,
  isLibraryPathname,
  toEmbedPathname,
  toLibraryPathname,
} from '@/lib/embed/embedRoutes';
import { describe, expect, it } from 'vitest';

describe('isEmbedPathname', () => {
  it.each([
    '/en/embed',
    '/en/embed/monsters/aboleth',
    '/fi/embed/world/ordovica',
  ])('accepts %s', (pathname) => {
    expect(isEmbedPathname(pathname)).toBe(true);
  });

  it.each([
    '/en/library/monsters/aboleth',
    '/en/embedded/thing',
    '/en/embedding',
    '/embed/monsters',
    '/en/utils/embed',
    '',
  ])('rejects %s', (pathname) => {
    expect(isEmbedPathname(pathname)).toBe(false);
  });
});

describe('isLibraryPathname', () => {
  it.each(['/en/library', '/en/library/spells/aid'])(
    'accepts %s',
    (pathname) => {
      expect(isLibraryPathname(pathname)).toBe(true);
    },
  );

  it.each(['/en/libraryish', '/en/embed/spells/aid', '/library/spells'])(
    'rejects %s',
    (pathname) => {
      expect(isLibraryPathname(pathname)).toBe(false);
    },
  );
});

describe('toEmbedPathname', () => {
  it('swaps the library segment and keeps the locale', () => {
    expect(toEmbedPathname('/en/library/monsters/aboleth')).toBe(
      '/en/embed/monsters/aboleth',
    );
    expect(toEmbedPathname('/fi/library/world')).toBe('/fi/embed/world');
  });

  it('rewrites only the leading segment', () => {
    expect(toEmbedPathname('/en/library/rules/library-of-ikuisuus')).toBe(
      '/en/embed/rules/library-of-ikuisuus',
    );
  });

  it('leaves pathnames outside the library tree untouched', () => {
    expect(toEmbedPathname('/en/embed/spells/aid')).toBe('/en/embed/spells/aid');
    expect(toEmbedPathname('/en/search')).toBe('/en/search');
  });
});

describe('toLibraryPathname', () => {
  it('swaps the embed segment back', () => {
    expect(toLibraryPathname('/en/embed/monsters/aboleth')).toBe(
      '/en/library/monsters/aboleth',
    );
  });

  it('leaves pathnames outside the embed tree untouched', () => {
    expect(toLibraryPathname('/en/search')).toBe('/en/search');
  });
});

describe('buildEmbedUrl', () => {
  it('builds an embed path from a content path and locale', () => {
    expect(buildEmbedUrl('world/ordovica', 'en')).toBe(
      '/en/embed/world/ordovica',
    );
  });
});
