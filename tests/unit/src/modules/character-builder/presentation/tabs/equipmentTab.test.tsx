/**
 * @fileoverview EquipmentTab Tests
 * @description Smoke tests for the equipment tab.
 *
 * @module tests/unit/lib/components/characterSheet/tabs/equipmentTab
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { EquipmentTab } from '@/modules/character-builder/presentation/tabs/equipmentTab';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

/** Assert against real English copy rather than raw message keys. */
vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<Record<string, unknown>>(),
  );
});

describe('EquipmentTab', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <EquipmentTab
        data={createEmptyCharacter()}
        editing={false}
        onChange={() => {}}
      />,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders coin pouch and carrying capacity placeholders', () => {
    render(
      <EquipmentTab
        data={createEmptyCharacter()}
        editing={false}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Coin Pouch')).toBeTruthy();
    expect(screen.getByText('Carrying Capacity')).toBeTruthy();
  });
});
