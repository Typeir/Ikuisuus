/**
 * @fileoverview EquipmentTab Tests
 * @description Smoke tests for the equipment tab.
 *
 * @module tests/unit/src/modules/character-builder/presentation/tabs/equipmentTab.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { EquipmentTab } from '@/modules/character-builder/presentation/tabs/equipmentTab';
import { screen } from '@testing-library/react';
import { renderWithActiveSheet } from '@tests/setup/renderWithActiveSheet';
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
    const { container } = renderWithActiveSheet(<EquipmentTab />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders coin pouch and carrying capacity placeholders', () => {
    renderWithActiveSheet(<EquipmentTab />);
    expect(screen.getByText('Coin Pouch')).toBeTruthy();
    expect(screen.getByText('Carrying Capacity')).toBeTruthy();
  });
});
