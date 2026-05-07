/**
 * @fileoverview AbilityScoreBlock Unit Tests
 * @description Tests for the AbilityScoreBlock component.
 *
 * @module tests/unit/lib/components/characterSheet/abilityScoreBlock
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { AbilityScoreBlock } from '@/lib/components/characterSheet/abilityScoreBlock';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('AbilityScoreBlock', () => {
  it('renders the label', () => {
    render(<AbilityScoreBlock label='STR' score={16} />);
    expect(screen.getByText('STR')).toBeTruthy();
  });

  it('renders the raw score', () => {
    render(<AbilityScoreBlock label='DEX' score={14} />);
    expect(screen.getByText('14')).toBeTruthy();
  });

  it('renders a positive modifier with + prefix', () => {
    render(<AbilityScoreBlock label='CON' score={18} />);
    expect(screen.getByText('+4')).toBeTruthy();
  });

  it('renders a negative modifier', () => {
    render(<AbilityScoreBlock label='INT' score={8} />);
    expect(screen.getByText('-1')).toBeTruthy();
  });

  it('renders a zero modifier as +0', () => {
    render(<AbilityScoreBlock label='WIS' score={10} />);
    expect(screen.getByText('+0')).toBeTruthy();
  });

  it('has an accessible aria-label', () => {
    render(<AbilityScoreBlock label='CHA' score={16} />);
    expect(
      screen.getByRole('generic', { name: /CHA: 16, modifier \+3/i }),
    ).toBeTruthy();
  });
});
