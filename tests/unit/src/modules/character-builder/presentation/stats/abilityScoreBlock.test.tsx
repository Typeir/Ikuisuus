/**
 * @fileoverview AbilityScoreBlock Unit Tests
 * @description Tests for the AbilityScoreBlock component, including the
 * saving-throw row (pip track + computed bonus).
 *
 * @module tests/unit/lib/components/characterSheet/abilityScoreBlock
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { AbilityScoreBlock } from '@/modules/character-builder/presentation/stats/abilityScoreBlock';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const baseProps = {
  saveTier: 'none' as const,
  tierBonus: 2,
};

describe('AbilityScoreBlock', () => {
  it('renders the label', () => {
    render(<AbilityScoreBlock {...baseProps} label='STR' score={16} />);
    expect(screen.getByText('STR')).toBeTruthy();
  });

  it('renders the raw score', () => {
    render(<AbilityScoreBlock {...baseProps} label='DEX' score={14} />);
    expect(screen.getByText('14')).toBeTruthy();
  });

  it('renders a positive modifier with + prefix', () => {
    render(<AbilityScoreBlock {...baseProps} label='CON' score={18} />);
    expect(screen.getAllByText('+4').length).toBeGreaterThanOrEqual(1);
  });

  it('renders a negative modifier', () => {
    render(<AbilityScoreBlock {...baseProps} label='INT' score={8} />);
    expect(screen.getAllByText('-1').length).toBeGreaterThanOrEqual(1);
  });

  it('renders a zero modifier as +0', () => {
    render(<AbilityScoreBlock {...baseProps} label='WIS' score={10} />);
    expect(screen.getAllByText('+0').length).toBeGreaterThanOrEqual(1);
  });

  it('has an accessible aria-label', () => {
    render(<AbilityScoreBlock {...baseProps} label='CHA' score={16} />);
    expect(
      screen.getByRole('generic', { name: /CHA: 16, modifier \+3/i }),
    ).toBeTruthy();
  });

  it('renders the saving-throw row with tier-scaled bonus', () => {
    render(
      <AbilityScoreBlock
        label='STR'
        score={16}
        saveTier='proficient'
        tierBonus={3}
      />,
    );
    // +3 ability mod + 3 tier bonus (proficient)
    expect(screen.getByText('+6')).toBeTruthy();
    expect(screen.getByText('saveLabel')).toBeTruthy();
  });

  it('fires onSaveTierChange when a pip is clicked in edit mode', async () => {
    const user = userEvent.setup();
    const onSaveTierChange = vi.fn();
    render(
      <AbilityScoreBlock
        {...baseProps}
        label='STR'
        score={16}
        editing
        onSaveTierChange={onSaveTierChange}
      />,
    );

    // Pip track is decorative (aria-hidden) — query hidden buttons.
    const pips = screen.getAllByRole('button', {
      name: /familiarity/i,
      hidden: true,
    });
    await user.click(pips[0]);
    expect(onSaveTierChange).toHaveBeenCalledWith('familiarity');
  });

  it('disables save pips outside edit mode', () => {
    render(<AbilityScoreBlock {...baseProps} label='STR' score={16} />);
    const pips = screen.getAllByRole('button', {
      name: /familiarity/i,
      hidden: true,
    });
    expect((pips[0] as HTMLButtonElement).disabled).toBe(true);
  });

  it('raises the save bonus to a granted floor', () => {
    render(
      <AbilityScoreBlock
        label='STR'
        score={16}
        saveTier='none'
        saveFloor='proficient'
        tierBonus={3}
      />,
    );
    // +3 ability mod + 3 tier bonus (granted proficient), though the stored tier is none
    expect(screen.getByText('+6')).toBeTruthy();
  });
});
