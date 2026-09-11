/**
 * @fileoverview Unit tests for the vocation core traits card.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/vocation/Vocation.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-05
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import Vocation, {
  Specialization,
} from '@/modules/library/presentation/components/slots/vocation/Vocation';
import {
  HitDie,
  PrimaryAbility,
} from '@/modules/library/presentation/components/slots/utils/slotElements';
import { printed } from '../cardQueries';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('../../../../../../../../setup/intlMock');
  const library = (await import('../../../../../../../../../messages/en/library.json')).default;
  return createRealMessageIntlMock(await importOriginal<Record<string, unknown>>(), { library });
});

describe('Vocation', () => {
  it('prints the heading above a Trait and Description table with the vocation labels', () => {
    render(
      <Vocation
        saves='Strength and Constitution'
        skills='Choose 2: Athletics'
        trades='Smithing'
        weapons='Simple and Martial weapons'>
        <h2>Core Berserker Traits</h2>
        <p>Body.</p>
      </Vocation>,
    );
    const section = document.querySelector('[data-vocation]');
    expect(section?.children[0].tagName).toBe('H2');
    expect(section?.children[0].textContent).toBe('Core Berserker Traits');
    expect(Array.from(document.querySelectorAll('th[scope="col"]')).map((th) => th.textContent)).toEqual([
      'Trait',
      'Description',
    ]);
    expect(Array.from(document.querySelectorAll('th[scope="row"]')).map((th) => th.textContent)).toEqual([
      'Saving Throw Proficiencies',
      'Skill Proficiencies',
      'Trade Proficiencies',
      'Weapon Proficiencies',
    ]);
    expect(document.querySelector('[data-slot="saves"] [data-slot-value]')?.textContent).toBe(
      'Strength and Constitution',
    );
    expect(document.querySelector('[data-vocation-body]')?.textContent).toBe('Body.');
    expect(document.querySelector('[data-vocation-body] h2')).toBeNull();
  });

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
    expect(printed()).toEqual(['primaryAbility', 'hitDie', 'saves', 'armor']);
    expect(screen.getByText('Body prose.')).toBeInTheDocument();
  });

  it('reads the element form and keeps schema order regardless of authoring order', () => {
    render(
      <Vocation>
        <p>
          <HitDie>d10 per Warrior level</HitDie>
          <PrimaryAbility>Strength or Dexterity</PrimaryAbility>
        </p>
      </Vocation>,
    );
    expect(printed()).toEqual(['primaryAbility', 'hitDie']);
  });

  it('renders only the body when no trait was written', () => {
    render(
      <Vocation>
        <p>Body only.</p>
      </Vocation>,
    );
    expect(document.querySelector('[data-slot-grid]')).toBeNull();
    expect(screen.getByText('Body only.')).toBeInTheDocument();
  });
});

describe('Specialization', () => {
  it('is the vocation card under its own tag, with the parent as a link', () => {
    render(
      <Specialization vocation='revenant'>
        <p>Oath prose.</p>
      </Specialization>,
    );
    expect(document.querySelector('[data-vocation][data-kind="specialization"]')).not.toBeNull();
    expect(printed()).toEqual(['vocation']);
    const link = document.querySelector('[data-slot="vocation"] a');
    expect(link?.getAttribute('href')).toBe('/en/library/character-creation/vocations/revenant');
    expect(link?.textContent).toBe('Revenant');
    expect(screen.getByText('Oath prose.')).toBeInTheDocument();
  });

  it('prints a parent that is not a slug as written, and a vocation writes no parent', () => {
    render(<Specialization vocation='Sword Saint of Ikuisuus' />);
    expect(document.querySelector('[data-slot="vocation"] a')).toBeNull();
    expect(document.querySelector('[data-slot="vocation"] [data-slot-value]')?.textContent).toBe(
      'Sword Saint of Ikuisuus',
    );
    document.body.innerHTML = '';

    render(<Vocation hitDie='d8 per Rogue level' />);
    expect(printed()).toEqual(['hitDie']);
  });
});
