/**
 * @fileoverview CombatStatsRow Unit Tests
 * @description Tests for the CombatStatsRow component.
 *
 * @module tests/unit/lib/components/characterSheet/combatStatsRow
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { CombatStatsRow } from '@/modules/character-builder/presentation/stats/combatStatsRow';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const DEFAULT_PROPS = {
  hpCurrent: 25,
  hpMax: 32,
  tempHp: 0,
  ac: 15,
  initiativeBonus: 2,
  speedOverride: 30,
  tierBonus: 3,
  vocations: [],
  hitDiceLog: [],
  onHitDiceCommit: vi.fn(),
  bloodlineSpeeds: [],
};

describe('CombatStatsRow', () => {
  it('renders current/max HP', () => {
    render(<CombatStatsRow {...DEFAULT_PROPS} />);
    expect(screen.getByText('25/32')).toBeTruthy();
  });

  it('shows temp HP when > 0', () => {
    render(<CombatStatsRow {...DEFAULT_PROPS} tempHp={5} />);
    expect(screen.getByText('+5')).toBeTruthy();
  });

  it('hides temp HP element when 0', () => {
    render(<CombatStatsRow {...DEFAULT_PROPS} tempHp={0} />);
    expect(screen.queryByText('+0')).toBeNull();
  });

  it('renders AC', () => {
    render(<CombatStatsRow {...DEFAULT_PROPS} />);
    expect(screen.getByText('15')).toBeTruthy();
  });

  it('renders positive initiative with + prefix', () => {
    render(
      <CombatStatsRow
        {...DEFAULT_PROPS}
        initiativeBonus={3}
        tierBonus={2}
      />,
    );
    expect(screen.getByText('+3')).toBeTruthy();
  });

  it('renders negative initiative without prefix duplication', () => {
    render(<CombatStatsRow {...DEFAULT_PROPS} initiativeBonus={-1} />);
    expect(screen.getByText('-1')).toBeTruthy();
  });

  it('renders speed in feet when speedOverride is set', () => {
    render(<CombatStatsRow {...DEFAULT_PROPS} speedOverride={30} />);
    expect(screen.getByText('30 ft.')).toBeTruthy();
  });

  it('renders — when speedOverride is null', () => {
    render(<CombatStatsRow {...DEFAULT_PROPS} speedOverride={null} />);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('renders tier bonus with + prefix', () => {
    render(<CombatStatsRow {...DEFAULT_PROPS} tierBonus={3} />);
    expect(screen.getByText('+3')).toBeTruthy();
  });
});
