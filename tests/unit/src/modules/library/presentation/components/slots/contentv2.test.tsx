/**
 * @fileoverview Unit tests for the content-v2 card hosts.
 * @description Spell, Trinket, Monster, Vocation and Feat. Assertions read the
 * structure and the derived values rather than label text, since the message
 * catalogue is not loaded under test and a translator echoes its key.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/contentv2.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import Feat from '@/modules/library/presentation/components/slots/Feat';
import Monster from '@/modules/library/presentation/components/slots/Monster';
import Spell from '@/modules/library/presentation/components/slots/Spell';
import { Trinket } from '@/modules/library/presentation/components/slots/Heirloom';
import Vocation from '@/modules/library/presentation/components/slots/Vocation';
import {
  Cost,
  Duration,
  Level,
  School,
} from '@/modules/library/presentation/components/slots/slotElements';

/**
 * Slot names printed by a card, in the order they appear.
 *
 * @returns {string[]} Slot names
 */
const printed = (): string[] =>
  Array.from(document.querySelectorAll('[data-slot-grid] [data-slot]')).map(
    (row) => row.getAttribute('data-slot') ?? '',
  );

/**
 * Text of the card's italic brief.
 *
 * @param {string} mark - Brief data attribute
 * @returns {string} Brief text
 */
const briefText = (mark: string): string =>
  document.querySelector(`[${mark}]`)?.textContent ?? '';

describe('Spell', () => {
  it('writes the brief from level and school, and rows from the rest', () => {
    render(
      <Spell
        level='3'
        school='evocation'
        cost='1 Major Action'
        components='V, S, M (a ball of bat guano and sulfur)'
        duration='Instantaneous'
        range='30 stride'
        targets='Creatures within a sphere'
        overcast='the spell gains damage'>
        <p>A bright streak flashes.</p>
      </Spell>,
    );
    expect(briefText('data-spell-brief')).toBe('3rd-level Evocation');
    expect(printed()).toEqual([
      'cost',
      'range',
      'targets',
      'duration',
      'components',
      'overcast',
    ]);
    expect(screen.getByText('A bright streak flashes.')).toBeInTheDocument();
  });

  it('calls a level-zero spell a cantrip', () => {
    render(<Spell level='0' school='evocation' />);
    expect(briefText('data-spell-brief')).toBe('Evocation cantrip');
  });

  it('carries a trigger beside the cost for a reaction spell', () => {
    render(
      <Spell
        level='1'
        cost='1 Reaction'
        trigger='when a creature you can see casts a spell'
      />,
    );
    expect(printed()).toEqual(['cost', 'trigger']);
  });

  it('reads the element form as well as attributes', () => {
    render(
      <Spell>
        <p>
          <Level>2</Level>
          <School>abjuration</School>
          <Cost>1 Minor Action</Cost>
          <Duration>1 hour</Duration>
        </p>
        <p>Body prose.</p>
      </Spell>,
    );
    expect(briefText('data-spell-brief')).toBe('2nd-level Abjuration');
    expect(printed()).toEqual(['cost', 'duration']);
    expect(screen.getByText('Body prose.')).toBeInTheDocument();
  });

  it('renders nothing above the body when no slot was written', () => {
    render(
      <Spell>
        <p>Body only.</p>
      </Spell>,
    );
    expect(document.querySelector('[data-spell-brief]')).toBeNull();
    expect(document.querySelector('[data-slot-grid]')).toBeNull();
  });
});

describe('Trinket', () => {
  it('names its category and prints what it carries', () => {
    render(
      <Trinket
        category='adventuring gear'
        cost='1 Minor Action'
        damage='—'
        range='touch'
        properties='Special (healing, consumable)'
        burden='3 burden'>
        <p>A stoppered vial.</p>
      </Trinket>,
    );
    expect(briefText('data-heirloom-brief')).toBe('Adventuring gear');
    expect(printed()).toEqual([
      'cost',
      'damage',
      'range',
      'properties',
      'burden',
    ]);
  });

  it('adds attunement to the brief when the trinket wants it', () => {
    render(<Trinket category='wondrous item' attunement='required' />);
    expect(briefText('data-heirloom-brief')).toBe(
      'Wondrous item, requiresAttunement',
    );
  });
});

describe('Monster', () => {
  it('writes the identity line, both tables, and the list', () => {
    render(
      <Monster
        size='Large'
        type='Monstrosity'
        alignment='Unaligned'
        armorClass='18'
        hitPoints='38'
        speed='4 stride'
        str='18'
        dex='12'
        con='14'
        int='8'
        wis='10'
        cha='9'
        senses='Passive Perception 12'
        languages='—'
        challenge='3'
        xp='700'>
        <p>Body prose.</p>
      </Monster>,
    );
    expect(briefText('data-monster-identity')).toBe(
      'Large Monstrosity, Unaligned',
    );
    expect(document.querySelector('[data-monster-defences]')).not.toBeNull();
    expect(document.querySelector('[data-monster-abilities]')).not.toBeNull();
    expect(screen.getByText('Body prose.')).toBeInTheDocument();
  });

  it('prints each ability score with the modifier it implies', () => {
    render(<Monster str='18' dex='12' con='14' int='8' wis='10' cha='9' />);
    const cells = Array.from(
      document.querySelectorAll('[data-monster-abilities] td'),
    ).map((cell) => cell.textContent);
    expect(cells).toEqual([
      '18 (+4)',
      '12 (+1)',
      '14 (+2)',
      '8 (-1)',
      '10 (+0)',
      '9 (-1)',
    ]);
  });

  it('derives the tier bonus from the challenge rating', () => {
    render(<Monster challenge='3' xp='700' />);
    const tier = document.querySelector('[data-slot="tierBonus"]');
    expect(tier?.textContent).toContain('+1');
    expect(tier?.querySelector('[data-derived-from="challenge"]')).not.toBeNull();
  });

  it('prefers a written tier bonus and marks it as authored', () => {
    render(<Monster challenge='3' xp='700' tierBonus='+9' />);
    const tier = document.querySelector('[data-slot="tierBonus"]');
    expect(tier?.textContent).toContain('+9');
    expect(tier?.querySelector('[data-derived-from]')).toBeNull();
  });

  it('omits a table the sheet carries no slot for', () => {
    render(<Monster size='Tiny' type='Wildlife' />);
    expect(document.querySelector('[data-monster-defences]')).toBeNull();
    expect(document.querySelector('[data-monster-abilities]')).toBeNull();
  });
});

describe('Vocation', () => {
  it('prints the core traits in schema order', () => {
    render(
      <Vocation
        primaryAbility='Dexterity and Wisdom'
        hitDie='d8 per Monk level'
        saves='Strength and Dexterity'
        armor='None'>
        <p>Body prose.</p>
      </Vocation>,
    );
    expect(printed()).toEqual([
      'primaryAbility',
      'hitDie',
      'saves',
      'armor',
    ]);
    expect(screen.getByText('Body prose.')).toBeInTheDocument();
  });
});

describe('Feat', () => {
  it('writes the ability sentence the corpus repeats by hand', () => {
    render(<Feat ability='Dexterity or Wisdom' />);
    expect(document.querySelector('[data-feat-ability]')).not.toBeNull();
  });

  it('names its category and prerequisite', () => {
    render(<Feat category='Epic Boon' prerequisite='Level 19' />);
    /* Under test a translator echoes its key, so this asserts the lookup
       reached the catalogue rather than printing the authored text. */
    expect(briefText('data-feat-brief')).toBe('category.epicBoon');
    expect(printed()).toEqual(['prerequisite']);
  });

  it('omits the ability sentence when the feat raises nothing', () => {
    render(
      <Feat category='General'>
        <p>Body prose.</p>
      </Feat>,
    );
    expect(document.querySelector('[data-feat-ability]')).toBeNull();
  });
});
