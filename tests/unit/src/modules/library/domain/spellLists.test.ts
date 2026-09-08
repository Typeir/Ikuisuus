/**
 * @fileoverview Unit tests for resolving the lists a spell appears on.
 *
 * @module tests/unit/src/modules/library/domain/spellLists.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-08
 */

import { describe, expect, it } from 'vitest';
import { spellListEntries } from '@/modules/library/domain/spellLists';

describe('spellListEntries', () => {
  it('sends a bare slug to the vocation’s own list', () => {
    expect(spellListEntries(['wizard'], 'en')).toEqual([
      {
        slug: 'wizard',
        name: 'Wizard',
        link: '/en/library/character-creation/vocations/wizard/spells',
      },
    ]);
  });

  it('sends a specialization slug to that specialization', () => {
    expect(spellListEntries(['berserker/want-of-knowledge'], 'en')).toEqual([
      {
        slug: 'berserker/want-of-knowledge',
        name: 'Want of Knowledge',
        link: '/en/library/character-creation/vocations/berserker/want-of-knowledge',
      },
    ]);
  });

  it('keeps the order the page wrote and drops blanks', () => {
    const entries = spellListEntries([' pilgrim ', '', '   ', 'villein'], 'en');

    expect(entries.map((entry) => entry.slug)).toEqual(['pilgrim', 'villein']);
  });

  it('writes the link for the locale it was given', () => {
    expect(spellListEntries(['wizard'], 'fi')[0].link).toBe(
      '/fi/library/character-creation/vocations/wizard/spells',
    );
  });

  it('titles a slug without capitalising the small words inside it', () => {
    expect(spellListEntries(['scion/oath-of-the-hunt'], 'en')[0].name).toBe(
      'Oath of the Hunt',
    );
  });

  it('is empty for nothing declared', () => {
    expect(spellListEntries([], 'en')).toEqual([]);
  });
});
