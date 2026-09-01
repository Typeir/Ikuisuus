/**
 * @fileoverview HintMarker tests
 * @description Verifies the feature-grant asterisk renders with an accessible
 * label when shown and renders nothing when hidden.
 *
 * @module tests/unit/src/modules/character-builder/presentation/atoms/hintMarker.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { HintMarker } from '@/modules/character-builder/presentation/atoms/hintMarker';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<Record<string, unknown>>(),
  );
});

describe('HintMarker', () => {
  it('renders an accessible asterisk when show is true', () => {
    render(<HintMarker show={true} />);
    const marker = screen.getByRole('img');
    expect(marker.textContent).toBe('*');
    expect(marker.getAttribute('aria-label')).toBe('Offered by a feature');
  });

  it('renders nothing when show is false', () => {
    const { container } = render(<HintMarker show={false} />);
    expect(container.firstChild).toBeNull();
  });
});
