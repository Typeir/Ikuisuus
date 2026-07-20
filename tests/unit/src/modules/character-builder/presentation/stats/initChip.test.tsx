/**
 * @fileoverview InitChip Unit Tests
 * @description Smoke tests for the Initiative combat stat chip.
 *
 * @module tests/unit/character-builder/presentation/stats/initChip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { InitChipMemo } from '@/modules/character-builder/presentation/stats/initChip';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('InitChip', () => {
  it('renders initiative label and formatted bonus', () => {
    const patch = vi.fn();
    render(
      <InitChipMemo
        initBonus={3}
        initStr='+3'
        isUnlocked={() => false}
        toggle={vi.fn()}
        patch={patch}
      />,
    );
    expect(screen.getByText('initiative')).toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('renders negative bonus correctly', () => {
    const patch = vi.fn();
    render(
      <InitChipMemo
        initBonus={-1}
        initStr='-1'
        isUnlocked={() => false}
        toggle={vi.fn()}
        patch={patch}
      />,
    );
    expect(screen.getByText('-1')).toBeInTheDocument();
  });

  it('shows input when unlocked', () => {
    const patch = vi.fn();
    render(
      <InitChipMemo
        initBonus={3}
        initStr='+3'
        isUnlocked={() => true}
        toggle={vi.fn()}
        patch={patch}
      />,
    );
    expect(screen.getByLabelText('initiative')).toBeInTheDocument();
  });
});
