/**
 * @fileoverview Unit tests for the monster stat block.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/Monster.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-05
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import Monster from '@/modules/library/presentation/components/slots/Monster';
import { briefText, printed } from './cardQueries';

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

  it('fills the identity line with defaults and marks them', () => {
    render(<Monster size='Large' alignment='Unaligned' />);
    /* Under test a translator echoes its key, so the default type reads as
       `type`; the point is that the comma survives and the gap is marked. */
    expect(briefText('data-monster-identity')).toBe('Large type, Unaligned');
    expect(
      document.querySelector(
        '[data-monster-identity] [data-derived-from="default"]',
      )?.textContent,
    ).toBe('type');
  });

  it('leaves the identity line out when no identity slot was written', () => {
    render(<Monster challenge='3' />);
    expect(document.querySelector('[data-monster-identity]')).toBeNull();
  });

  it('derives the XP a sheet leaves out from its rating', () => {
    render(<Monster challenge='3' />);
    const xp = document.querySelector('[data-monster-xp]');
    expect(xp?.textContent).toContain('700 XP');
    expect(xp?.getAttribute('data-derived-from')).toBe('challenge');
  });

  it('derives the rating a sheet leaves out from its XP', () => {
    render(<Monster xp='10000' />);
    const row = document.querySelector('[data-slot="challenge"]');
    expect(row?.querySelector('[data-derived-from="xp"]')?.textContent).toBe(
      '13',
    );
    expect(row?.textContent).toContain('(10000 XP)');
    expect(
      document.querySelector('[data-slot="tierBonus"]')?.textContent,
    ).toContain('+5');
  });

  it('prints a fixed save DC among the list rows, before the rating', () => {
    render(<Monster saveDc='16' challenge='13' xp='10000' />);
    expect(printed()).toEqual(['saveDc', 'challenge', 'tierBonus']);
    expect(
      document.querySelector('[data-slot="saveDc"]')?.textContent,
    ).toContain('16');
  });

  it('prints both as written when the sheet carries both', () => {
    render(<Monster challenge='3' xp='700' />);
    const row = document.querySelector('[data-slot="challenge"]');
    expect(row?.querySelector('[data-derived-from]')).toBeNull();
    expect(row?.textContent).toBe('slots.challenge3 (700 XP)');
  });
});
