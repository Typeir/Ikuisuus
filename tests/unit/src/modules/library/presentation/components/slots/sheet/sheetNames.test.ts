/**
 * @fileoverview sheetNames tests.
 * @module tests/unit/src/modules/library/presentation/components/slots/sheet/sheetNames.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import type { Division } from '@/modules/library/presentation/components/slots/utils/divisions';
import { unprefixed } from '@/modules/library/presentation/components/slots/sheet/sheetNames';
import { describe, expect, it } from 'vitest';

/**
 * Pages carrying only the names the bar reads.
 *
 * @param {string[]} names - What each page is called.
 * @returns {Division[]} The pages.
 */
const pagesOf = (names: string[]): Division[] =>
  names.map((name) => ({ name }) as unknown as Division);

/**
 * What the bar would print for these names.
 *
 * @param {string[]} names - What each page is called.
 * @returns {string[]} What is printed.
 */
const printed = (names: string[]): string[] => unprefixed(pagesOf(names));

describe('unprefixed', () => {
  it('should leave a lone name whole', () => {
    expect(printed(['Marduk, The Man.'])).toEqual(['Marduk, The Man.']);
  });

  it('should drop an opening the pages share', () => {
    expect(
      printed(['Lunar Chimera, Lion', 'Lunar Chimera, Serpent']),
    ).toEqual(['Lion', 'Serpent']);
  });

  it('should cut back to a word, never mid-word', () => {
    expect(printed(['Borderlander Blademaster', 'Borderlander Barrel-lord'])).toEqual(
      ['Blademaster', 'Barrel-lord'],
    );
  });

  it('should take a bracket off with the opening it belongs to', () => {
    expect(
      printed([
        'Husk of Xanthosis (Sword-Wielder)',
        'Husk of Xanthosis (Biter)',
        'Husk of Xanthosis (Spellcaster/Ranged)',
      ]),
    ).toEqual(['Sword-Wielder', 'Biter', 'Spellcaster/Ranged']);
  });

  it('should cut at a dash where that is the break', () => {
    expect(
      printed([
        'Laquirronto (Kynsilaccus moppi) – Cub Variant',
        'Laquirronto (Kynsilaccus moppi) – Adult Variant',
      ]),
    ).toEqual(['Cub Variant', 'Adult Variant']);
  });

  it('should keep whole names when the pages share no opening', () => {
    expect(printed(['Hunter Frog', 'Golden Frog'])).toEqual([
      'Hunter Frog',
      'Golden Frog',
    ]);
  });

  it('should drop the opening even where one name contains the other', () => {
    expect(printed(['Spawn of Dead Air', 'Spawn of Dead Air Two'])).toEqual([
      'Air',
      'Air Two',
    ]);
  });

  it('should keep whole names rather than leave one of them empty', () => {
    /* The shared opening runs to the end of the first name, so taking it off
       would leave that page with nothing to be called. */
    expect(printed(['Lion -', 'Lion - Cub'])).toEqual(['Lion -', 'Lion - Cub']);
  });

  it('should keep whole names when they share all but a letter', () => {
    expect(printed(['Angelic', 'Angelica'])).toEqual(['Angelic', 'Angelica']);
  });

  it('should answer nothing for no pages at all', () => {
    expect(printed([])).toEqual([]);
  });
});
