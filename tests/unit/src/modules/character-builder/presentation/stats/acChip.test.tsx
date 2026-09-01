/**
 * @fileoverview AcChip Unit Tests
 * @description Smoke tests for the AC combat stat chip.
 *
 * @module tests/unit/src/modules/character-builder/presentation/stats/acChip.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { AcChipMemo } from '@/modules/character-builder/presentation/stats/acChip';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('AcChip', () => {
  it('renders AC value and label', () => {
    const patch = vi.fn();
    render(
      <AcChipMemo
        ac={15}
        isUnlocked={() => false}
        toggle={vi.fn()}
        patch={patch}
      />,
    );
    expect(screen.getByText('ac')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('shows input when unlocked', () => {
    const patch = vi.fn();
    render(
      <AcChipMemo
        ac={15}
        isUnlocked={() => true}
        toggle={vi.fn()}
        patch={patch}
      />,
    );
    expect(screen.getByLabelText('ac')).toBeInTheDocument();
  });
});
