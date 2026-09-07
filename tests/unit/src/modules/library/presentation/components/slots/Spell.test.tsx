/**
 * @fileoverview Unit tests for the spell card.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/Spell.test
 * @version 0.3.0
 * @author Typeir
 * @since 2026-09-03
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import Spell from '@/modules/library/presentation/components/slots/Spell';
import {
  Cost,
  Duration,
  Level,
} from '@/modules/library/presentation/components/slots/slotElements';
import { briefText, printed } from './cardQueries';

describe('Spell', () => {
  it('writes the brief from the level, and rows from the rest', () => {
    render(
      <Spell
        level='3'
        cost='1 Major Action'
        components='V, S, M (a ball of bat guano and sulfur)'
        duration='Instantaneous'
        range='30 stride'
        targets='Creatures within a sphere'
        overcast='the spell gains damage'>
        <p>A bright streak flashes.</p>
      </Spell>,
    );
    expect(briefText('data-spell-brief')).toMatch(/^3rd-level (?:spell|kind)$/);
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
    render(<Spell level='0' />);
    expect(briefText('data-spell-brief')).toMatch(/^cantrip$/i);
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
          <Cost>1 Minor Action</Cost>
          <Duration>1 hour</Duration>
        </p>
        <p>Body prose.</p>
      </Spell>,
    );
    expect(briefText('data-spell-brief')).toMatch(/^2nd-level (?:spell|kind)$/);
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

  it('speaks a rarity above common after the level, and none for common', () => {
    render(<Spell level='10' rarity='legendary' />);
    expect(briefText('data-spell-brief')).toMatch(/^10th-level Legendary (?:spell|kind)$/);
    document.body.innerHTML = '';

    render(<Spell level='0' rarity='rare' />);
    expect(briefText('data-spell-brief')).toBe('Rare cantrip');
    document.body.innerHTML = '';

    render(<Spell level='3' rarity='common' />);
    expect(briefText('data-spell-brief')).toMatch(/^3rd-level (?:spell|kind)$/);
    document.body.innerHTML = '';

    render(<Spell rarity='Legendary' />);
    expect(briefText('data-spell-brief')).toMatch(/^Legendary (?:spell|kind)$/);
  });

  it('reads the ritual flag bare, and reads the negated word', () => {
    render(<Spell level='2' ritual />);
    expect(briefText('data-spell-brief')).toMatch(/^2nd-level (?:spell|kind) \(ritual\)$/);
    document.body.innerHTML = '';

    render(<Spell level='2' ritual={false} />);
    expect(briefText('data-spell-brief')).toMatch(/^2nd-level (?:spell|kind)$/);
    document.body.innerHTML = '';

    render(<Spell level='2' ritual='false' />);
    expect(briefText('data-spell-brief')).toMatch(/^2nd-level (?:spell|kind)$/);
  });
});
