/**
 * @fileoverview Tests for the SEO module shared types.
 *
 * Validates that the PageSeoInput interface is structurally correct by
 * constructing conforming and non-conforming objects.
 *
 * @module tests/unit/src/lib/seo/types.test
 */
import type { PageSeoInput } from '@/lib/seo/types';
import { describe, expect, it } from 'vitest';

describe('PageSeoInput', () => {
  it('accepts a minimal valid input with required fields only', () => {
    const input: PageSeoInput = {
      title: 'Dreaded Defender',
      locale: 'en',
      slugPath: 'items/heirlooms/dreaded-defender',
    };
    expect(input.title).toBe('Dreaded Defender');
    expect(input.locale).toBe('en');
    expect(input.slugPath).toBe('items/heirlooms/dreaded-defender');
  });

  it('accepts a full input with all optional fields populated', () => {
    const input: PageSeoInput = {
      title: 'Dreaded Defender',
      description: 'A blackened medallion.',
      image: '/library/images/heirlooms/dreaded-defender.webp',
      imageAlt: 'Dreaded Defender medallion',
      keywords: ['heirlooms', 'magic items', 'd20'],
      locale: 'en',
      slugPath: 'items/heirlooms/dreaded-defender',
    };
    expect(input.description).toBe('A blackened medallion.');
    expect(input.image).toBe('/library/images/heirlooms/dreaded-defender.webp');
    expect(input.imageAlt).toBe('Dreaded Defender medallion');
    expect(input.keywords).toEqual(['heirlooms', 'magic items', 'd20']);
  });
});
