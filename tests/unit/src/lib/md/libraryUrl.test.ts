/**
 * @fileoverview Library URL Expansion Unit Tests
 * @description Tests the shorthand a link may be authored in, and every shape
 * expansion has to leave alone.
 *
 * @module tests/unit/src/lib/md/libraryUrl.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { describe, expect, it } from 'vitest';

import { expandLibraryUrl } from '@/lib/md/libraryUrl';

describe('expandLibraryUrl', () => {
  it('should expand a path carrying neither locale nor library', () => {
    expect(
      expandLibraryUrl('/rules/steel-and-strife/conditions', 'en'),
    ).toBe('/en/library/rules/steel-and-strife/conditions');
  });

  it('should expand a path carrying library but no locale', () => {
    expect(
      expandLibraryUrl('/library/rules/steel-and-strife/conditions', 'en'),
    ).toBe('/en/library/rules/steel-and-strife/conditions');
  });

  it('should keep the anchor on an expanded path', () => {
    expect(
      expandLibraryUrl('/rules/steel-and-strife/conditions#prone', 'en'),
    ).toBe('/en/library/rules/steel-and-strife/conditions#prone');
  });

  it('should keep a query on an expanded path', () => {
    expect(expandLibraryUrl('/spells/sway?from=list', 'en')).toBe(
      '/en/library/spells/sway?from=list',
    );
  });

  it('should expand into the locale it is given', () => {
    expect(expandLibraryUrl('/spells/sway', 'fi')).toBe(
      '/fi/library/spells/sway',
    );
  });

  it('should leave a link that already carries its locale', () => {
    const url = '/en/library/rules/steel-and-strife/conditions';

    expect(expandLibraryUrl(url, 'en')).toBe(url);
  });

  it.each([
    ['an anchor on the page', '#prone'],
    ['a bare relative path', 'weaving'],
    ['an external link', 'https://example.com/rules/x'],
    ['a protocol-relative link', '//example.com/rules/x'],
    ['a mail link', 'mailto:someone@example.com'],
  ])('should leave %s alone', (_label, url) => {
    expect(expandLibraryUrl(url, 'en')).toBe(url);
  });

  it.each([['/api/discovery'], ['/images/sigil.png'], ['/_next/static/x.js']])(
    'should leave the reserved app path %s alone',
    (url) => {
      expect(expandLibraryUrl(url, 'en')).toBe(url);
    },
  );

  it('should leave a bare root alone', () => {
    expect(expandLibraryUrl('/', 'en')).toBe('/');
  });
});
