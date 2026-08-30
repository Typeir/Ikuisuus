/**
 * @fileoverview anchorSlug Tests
 * @module tests/unit/src/modules/library/domain/anchorSlug
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { anchorSlug } from '@/modules/library/domain/anchorSlug';
import { toKebabCase } from '@/lib/utils/toKebabCase';
import { describe, expect, it } from 'vitest';

describe('anchorSlug', () => {
  it('should lowercase, hyphenate and strip punctuation', () => {
    expect(anchorSlug('My Awesome Heading!')).toBe('my-awesome-heading');
    expect(anchorSlug('  Multiple   Spaces  ')).toBe('multiple-spaces');
    expect(anchorSlug('Quacke (Recharge 5–6)')).toBe('quacke-recharge-56');
    expect(anchorSlug('--Edge-- ')).toBe('edge');
  });

  describe('diacritics', () => {
    it('should keep accented letters rather than dropping them', () => {
      expect(anchorSlug('Spear of Päimär')).toBe('spear-of-päimär');
      expect(anchorSlug('Silmä')).toBe('silmä');
      expect(anchorSlug('Carranza’s Great Épée')).toBe('carranzas-great-épée');
    });

    it('should keep headings distinct that folding would collapse', () => {
      expect(anchorSlug('Väki')).not.toBe(anchorSlug('Vaki'));
    });

    it('should compose equivalent forms to the same anchor', () => {
      const composed = 'Sylvän';
      const decomposed = 'Sylvän';

      expect(anchorSlug(decomposed)).toBe(anchorSlug(composed));
    });

    /* Filenames and route slugs run through `toKebabCase`, which keeps the same
       letters. A heading and a filename for one name must not disagree. */
    it('should agree with the filename rule on the same name', () => {
      for (const name of ['Väärät', 'Silmä', 'Väkis']) {
        expect(anchorSlug(name)).toBe(toKebabCase(name));
      }
    });
  });
});
