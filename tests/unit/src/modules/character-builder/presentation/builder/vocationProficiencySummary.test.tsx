/**
 * @fileoverview VocationProficiencySummary Unit Tests
 * @description Verifies the fixed proficiency digest: every SAVES/SKILLS/ARMOR/
 * WEAPONS/TRADES row is always rendered, absent grants (or no vocation) show an
 * em dash, and inline markdown markers are stripped from grant values.
 *
 * @module tests/unit/src/modules/character-builder/presentation/builder/vocationProficiencySummary.test
 * @version 2.0.0
 * @author Typeir
 * @since 7.0.0
 */

import type { VocationOption } from '@/lib/types/vocations';
import { VocationProficiencySummary } from '@/modules/character-builder/presentation/builder/vocationProficiencySummary';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<Record<string, unknown>>(),
  );
});

const baseVocation: VocationOption = {
  slug: 'berserker',
  title: 'Berserker',
  file: 'x.mdx',
  features: [],
};

describe('VocationProficiencySummary', () => {
  it('renders every labelled row for a fully-specified vocation', () => {
    const vocation: VocationOption = {
      ...baseVocation,
      savingThrows: ['Strength', 'Constitution'],
      skillProficiencies: { count: 2, choices: ['a', 'b', 'c', 'd', 'e', 'f'] },
      toolProficiencies: ["Thieves' Tools"],
      armorProficiencies: ['Light', 'Medium', 'Shields'],
      weaponProficiencies: ['Simple', 'Martial'],
    };
    render(<VocationProficiencySummary vocation={vocation} />);
    expect(screen.getByText('Saves:')).toBeTruthy();
    expect(screen.getByText('Skills:')).toBeTruthy();
    expect(screen.getByText('Armor:')).toBeTruthy();
    expect(screen.getByText('Weapons:')).toBeTruthy();
    expect(screen.getByText('Trades:')).toBeTruthy();
    expect(screen.getByText('STR, CON')).toBeTruthy();
    expect(screen.getByText('2 of 6')).toBeTruthy();
    expect(screen.getByText("Thieves' Tools")).toBeTruthy();
    expect(screen.getByText('Light, Medium, Shields')).toBeTruthy();
    expect(screen.getByText('Simple, Martial')).toBeTruthy();
  });

  it('shows an em dash for rows the vocation does not grant', () => {
    const vocation: VocationOption = {
      ...baseVocation,
      savingThrows: ['Dexterity'],
      skillProficiencies: { count: 0, choices: [] },
      toolProficiencies: [],
      armorProficiencies: [],
      weaponProficiencies: [],
    };
    render(<VocationProficiencySummary vocation={vocation} />);
    expect(screen.getByText('DEX')).toBeTruthy();
    expect(screen.getAllByText('—')).toHaveLength(4);
  });

  it('renders all rows with em dashes when no vocation is selected', () => {
    render(<VocationProficiencySummary />);
    expect(screen.getByText('Saves:')).toBeTruthy();
    expect(screen.getByText('Trades:')).toBeTruthy();
    expect(screen.getAllByText('—')).toHaveLength(5);
  });

  it('strips inline markdown bold markers split across grant values', () => {
    const vocation: VocationOption = {
      ...baseVocation,
      armorProficiencies: ['**Light', 'Medium', 'Heavy**'],
      weaponProficiencies: ['**Martial', 'Simple**'],
    };
    render(<VocationProficiencySummary vocation={vocation} />);
    expect(screen.getByText('Light, Medium, Heavy')).toBeTruthy();
    expect(screen.getByText('Martial, Simple')).toBeTruthy();
  });
});
