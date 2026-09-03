/**
 * @fileoverview Unit tests for the Heirloom wrapper.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/heirloom.test
 * @version 0.2.0
 * @author Typeir
 * @since 2026-09-02
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import Attributes from '@/modules/library/presentation/components/slots/Attributes';
import Heirloom from '@/modules/library/presentation/components/slots/Heirloom';
import {
  Attunement,
  Cost,
  Quality,
  Rarity,
} from '@/modules/library/presentation/components/slots/slotElements';

describe('Heirloom', () => {
  it('writes the brief from the identity slots', () => {
    render(
      <Heirloom
        rarity='very rare'
        attunement='required'
        base='Curved longsword (Finesse, Versatile)'
        quality='Enhanced'
        enchantment='+1 accuracy, +1 damage'
        focus='spellcasting, while attuned'>
        <p>Body prose.</p>
      </Heirloom>,
    );
    const brief = document.querySelector('[data-heirloom-brief]');
    const lines = Array.from(brief?.querySelectorAll('em') ?? []).map(
      (line) => line.textContent,
    );
    expect(lines).toEqual([
      'Very rare kind, requiresAttunement',
      'Enhanced curved longsword (Finesse, Versatile), enchanted +1 accuracy and damage',
      'Spellcasting focus while attuned',
    ]);
    expect(document.querySelector('[data-slot="attunement"]')).toBeNull();
    expect(screen.getByText('Body prose.')).toBeInTheDocument();
  });

  it('omits the quality adjective for a Mundane object and the clause without attunement', () => {
    render(
      <Heirloom rarity='common' base='Dagger' quality='Mundane'>
        <p>Body.</p>
      </Heirloom>,
    );
    const lines = Array.from(
      document.querySelectorAll('[data-heirloom-brief] em'),
    ).map((line) => line.textContent);
    expect(lines).toEqual(['Common kind', 'Dagger']);
  });

  it('gives every optional extra its own line', () => {
    render(
      <Heirloom rarity='rare' base='Amulet' focus='graviturgy' nullifying='(WIS) (+10)'>
        <p>Body.</p>
      </Heirloom>,
    );
    const lines = Array.from(
      document.querySelectorAll('[data-heirloom-brief] em'),
    ).map((line) => line.textContent);
    expect(lines).toEqual([
      'Rare kind',
      'Amulet',
      'Graviturgy focus',
      'nullifying (WIS) (+10)',
    ]);
  });

  it('prints the numbers where the marker sits, and nowhere on its own', () => {
    render(
      <Heirloom rarity='rare' base='Plate' armorClass='18' stealth='disadvantage' burden='4'>
        <p>Primer.</p>
        <hr />
        <section data-heading-level={3} data-anchor='attributes'>
          <h3>Attributes</h3>
          <Attributes />
        </section>
        <p>Feature prose.</p>
      </Heirloom>,
    );
    const filed = document.querySelector(
      'section[data-anchor="attributes"] [data-heirloom-stats]',
    );
    expect(filed).not.toBeNull();
    const rows = Array.from(
      filed?.querySelectorAll(':scope > li > [data-slot]') ?? [],
    ).map((row) => row.getAttribute('data-slot'));
    expect(rows).toEqual(['armorClass', 'stealth', 'burden']);
    expect(
      document.querySelector('[data-slot="armorClass"] [data-slot-value]')
        ?.textContent,
    ).toBe('18');
    expect(
      document.querySelector('[data-heirloom] > [data-heirloom-stats]'),
    ).toBeNull();
  });

  it('prints nothing without a marker', () => {
    render(
      <Heirloom rarity='rare' base='Plate' armorClass='18'>
        <p>Primer.</p>
        <hr />
      </Heirloom>,
    );
    expect(document.querySelector('[data-heirloom-stats]')).toBeNull();
  });

  it('the marker can ask for particular slots', () => {
    render(
      <Heirloom rarity='rare' base='Plate' armorClass='18' stealth='disadvantage' burden='4'>
        <Attributes burden armorClass />
      </Heirloom>,
    );
    const rows = Array.from(
      document.querySelectorAll('[data-heirloom-stats] > li > [data-slot]'),
    ).map((row) => row.getAttribute('data-slot'));
    expect(rows).toEqual(['armorClass', 'burden']);
  });

  it('prints the versatile die inside the damage line', () => {
    render(
      <Heirloom rarity='rare' base='Longsword' damage='1d8 slashing' versatile='1d10'>
        <Attributes />
      </Heirloom>,
    );
    expect(
      document.querySelector('[data-slot="damage"] [data-slot-value]')
        ?.textContent,
    ).toBe('1d8 slashing (1d10)');
    expect(document.querySelector('[data-slot="versatile"]')).toBeNull();
  });

  it('reads header slots written as elements into the same brief', () => {
    render(
      <Heirloom>
        <p>
          <Rarity>very rare</Rarity>
          {'\n'}
          <Attunement>required</Attunement>
          {'\n'}
          <Quality>Enhanced</Quality>
        </p>
        <p>Body.</p>
      </Heirloom>,
    );
    const lines = Array.from(
      document.querySelectorAll('[data-heirloom-brief] em'),
    ).map((line) => line.textContent);
    expect(lines[0]).toBe('Very rare kind, requiresAttunement');
    expect(lines[1]).toBe('Enhanced');
    expect(document.querySelector('[data-slot]')).toBeNull();
  });

  it('keeps non-slot paragraphs in the body', () => {
    render(
      <Heirloom rarity='rare' base='Dagger'>
        <p>Ordinary paragraph.</p>
        <p>
          <Cost>1 Minor Action</Cost>
        </p>
      </Heirloom>,
    );
    expect(screen.getByText('Ordinary paragraph.')).toBeInTheDocument();
    expect(screen.getByText('1 Minor Action')).toBeInTheDocument();
  });
});
