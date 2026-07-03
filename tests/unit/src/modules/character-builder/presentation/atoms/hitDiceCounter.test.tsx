/**
 * @fileoverview HitDiceCounter Unit Tests
 * @description Tests for the HitDiceCounter atom component.
 *
 * @module tests/unit/lib/components/characterSheet/atoms/hitDiceCounter
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

import { HitDiceCounter } from '@/modules/character-builder/presentation/atoms/hitDiceCounter';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const makeVocation = (
  slug: string,
  title: string,
  level: number,
  hitDie: string,
) => ({
  slug,
  title,
  level,
  hitDie,
  specializationSlug: null,
  specializationTitle: '',
  vocationFeatures: [],
  specializationFeatures: [],
});

describe('HitDiceCounter', () => {
  it('shows dash when no active vocations', () => {
    render(<HitDiceCounter vocations={[]} />);
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('shows single die type for one vocation', () => {
    const vocations = [makeVocation('Berserker', 'Berserker', 5, 'd12')];
    render(<HitDiceCounter vocations={vocations} />);
    expect(screen.getByText('5d12')).toBeTruthy();
  });

  it('shows single die type for one vocation (no d prefix)', () => {
    const vocations = [makeVocation('warrior', 'Warrior', 3, '10')];
    render(<HitDiceCounter vocations={vocations} />);
    expect(screen.getByText('3d10')).toBeTruthy();
  });

  it('shows mixed Nd? for multi-vocation with different dice', () => {
    const vocations = [
      makeVocation('Berserker', 'Berserker', 3, 'd12'),
      makeVocation('wizard', 'Wizard', 2, 'd6'),
    ];
    render(<HitDiceCounter vocations={vocations} />);
    expect(screen.getByText('5d?')).toBeTruthy();
  });

  it('ignores vocations with empty slug', () => {
    const vocations = [
      makeVocation('Berserker', 'Berserker', 5, 'd12'),
      makeVocation('', '', 1, ''),
    ];
    render(<HitDiceCounter vocations={vocations} />);
    expect(screen.getByText('5d12')).toBeTruthy();
  });

  it('shows total level for multiple same-die vocations', () => {
    const vocations = [
      makeVocation('Warrior', 'Warrior', 4, 'd10'),
      makeVocation('paladin', 'Paladin', 2, 'd10'),
    ];
    render(<HitDiceCounter vocations={vocations} />);
    expect(screen.getByText('6d10')).toBeTruthy();
  });
});
