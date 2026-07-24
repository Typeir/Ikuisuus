/**
 * @fileoverview VocationProficiencySummary Unit Tests
 * @description Verifies the compact proficiency digest renders granted segments
 * (abbreviated saves, skill count, joined lists) and hides itself when a
 * vocation carries no proficiency metadata.
 *
 * @module tests/unit/modules/character-builder/presentation/builder/vocationProficiencySummary
 * @version 1.0.0
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
  it('renders abbreviated saves, skill count, and grant lists', () => {
    const vocation: VocationOption = {
      ...baseVocation,
      savingThrows: ['Strength', 'Constitution'],
      skillProficiencies: { count: 2, choices: ['a', 'b', 'c', 'd', 'e', 'f'] },
      toolProficiencies: ["Thieves' Tools"],
      armorProficiencies: ['Light', 'Medium', 'Shields'],
      weaponProficiencies: ['Simple', 'Martial'],
    };
    render(<VocationProficiencySummary vocation={vocation} />);
    expect(screen.getByText('STR, CON')).toBeTruthy();
    expect(screen.getByText('2 of 6')).toBeTruthy();
    expect(screen.getByText("Thieves' Tools")).toBeTruthy();
    expect(screen.getByText('Light, Medium, Shields')).toBeTruthy();
    expect(screen.getByText('Simple, Martial')).toBeTruthy();
  });

  it('omits segments that have no grants', () => {
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
    expect(screen.queryByText('Skills:')).toBeNull();
    expect(screen.queryByText('Tools:')).toBeNull();
  });

  it('renders nothing when the vocation has no proficiency metadata', () => {
    const { container } = render(
      <VocationProficiencySummary vocation={baseVocation} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
