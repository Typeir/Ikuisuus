/**
 * @fileoverview localizeLink Unit Tests
 * @module tests/unit/src/modules/search/domain/localizeLink
 */

import { localizeLink } from '@/modules/search/domain/localizeLink';
import { describe, expect, it } from 'vitest';

describe('localizeLink', () => {
  it('prepends the locale to a locale-less link', () => {
    expect(localizeLink('/library/monsters/aboleth', 'en')).toBe(
      '/en/library/monsters/aboleth',
    );
  });

  it('does not double an existing locale prefix', () => {
    expect(
      localizeLink('/en/library/character-creation/vocations/bard/main', 'en'),
    ).toBe('/en/library/character-creation/vocations/bard/main');
  });

  it('replaces a mismatched locale prefix', () => {
    expect(localizeLink('/en/library/spells/fireball', 'fi')).toBe(
      '/fi/library/spells/fireball',
    );
  });

  it('collapses repeated locale prefixes', () => {
    expect(localizeLink('/en/en/library/monsters/aboleth', 'en')).toBe(
      '/en/library/monsters/aboleth',
    );
  });

  it('adds a leading slash when missing', () => {
    expect(localizeLink('library/monsters/aboleth', 'en')).toBe(
      '/en/library/monsters/aboleth',
    );
  });

  it('strips broken #undefined anchors', () => {
    expect(localizeLink('/library/monsters/aboleth#undefined', 'en')).toBe(
      '/en/library/monsters/aboleth',
    );
  });

  it('keeps legitimate anchors', () => {
    expect(localizeLink('/library/spells/fireball#at-higher-levels', 'en')).toBe(
      '/en/library/spells/fireball#at-higher-levels',
    );
  });

  it('is idempotent', () => {
    const once = localizeLink('/library/monsters/aboleth', 'es');
    expect(localizeLink(once, 'es')).toBe(once);
  });

  it('does not strip non-locale two-letter segments', () => {
    expect(localizeLink('/library/it/something', 'en')).toBe(
      '/en/library/it/something',
    );
  });
});
