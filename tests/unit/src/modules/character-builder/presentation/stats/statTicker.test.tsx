/**
 * @fileoverview StatTicker Unit Tests
 * @description Tests for the StatTicker component.
 *
 * @module tests/unit/lib/components/characterSheet/statTicker
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { StatTicker } from '@/modules/character-builder/presentation/stats/statTicker';
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

describe('StatTicker', () => {
  it('renders the ticker container', () => {
    const character = createEmptyCharacter();
    render(<StatTicker character={character} />);
    expect(
      screen.getByRole('generic', { name: /character stat ticker/i }),
    ).toBeTruthy();
  });

  it('shows the character level', () => {
    const character = { ...createEmptyCharacter(), level: 5 };
    render(<StatTicker character={character} />);
    const all = screen.getAllByText(/LV 5/);
    expect(all.length).toBeGreaterThanOrEqual(1);
  });

  it('shows HP in current/max format', () => {
    const character = { ...createEmptyCharacter(), hpCurrent: 18, hpMax: 32 };
    render(<StatTicker character={character} />);
    const all = screen.getAllByText(/HP 18\/32/);
    expect(all.length).toBeGreaterThanOrEqual(1);
  });

  it('duplicates content for the seamless loop', () => {
    const character = { ...createEmptyCharacter(), level: 7 };
    render(<StatTicker character={character} />);
    expect(screen.getAllByText(/LV 7/).length).toBe(2);
  });
});
