/**
 * @fileoverview SpeedPanel Unit Tests
 * @description Tests for the SpeedPanel atom component.
 *
 * @module tests/unit/lib/components/characterSheet/atoms/speedPanel
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

import { SpeedPanel } from '@/modules/character-builder/presentation/atoms/speedPanel';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

/** Assert against real English copy rather than raw message keys. */
vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<Record<string, unknown>>(),
  );
});

describe('SpeedPanel', () => {
  it('renders nothing when bloodlineSpeeds is empty', () => {
    const { container } = render(<SpeedPanel bloodlineSpeeds={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders trigger for single speed', () => {
    render(<SpeedPanel bloodlineSpeeds={['Walk: 30 ft.']} />);
    expect(screen.getByRole('button', { name: /show all movement speeds/i })).toBeTruthy();
  });

  it('shows + badge when multiple speeds exist', () => {
    render(<SpeedPanel bloodlineSpeeds={['Walk: 30 ft.', 'Fly: 60 ft.']} />);
    expect(screen.getByText('+')).toBeTruthy();
  });

  it('does not show + badge for a single speed', () => {
    render(<SpeedPanel bloodlineSpeeds={['Walk: 30 ft.']} />);
    expect(screen.queryByText('+')).toBeNull();
  });

  it('opens panel on trigger click', () => {
    render(<SpeedPanel bloodlineSpeeds={['Walk: 30 ft.', 'Fly: 60 ft.']} />);
    fireEvent.click(screen.getByRole('button', { name: /show all movement speeds/i }));
    expect(screen.getByRole('list', { name: /movement speeds/i })).toBeTruthy();
  });

  it('lists all speed entries when open', () => {
    render(<SpeedPanel bloodlineSpeeds={['Walk: 30 ft.', 'Fly: 60 ft.']} />);
    fireEvent.click(screen.getByRole('button', { name: /show all movement speeds/i }));
    expect(screen.getByText('Walk: 30 ft.')).toBeTruthy();
    expect(screen.getByText('Fly: 60 ft.')).toBeTruthy();
  });
});
