/**
 * @fileoverview GritChip Unit Tests
 * @description Smoke tests for the Grit combat stat chip.
 *
 * @module tests/unit/character-builder/presentation/stats/gritChip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { GritChipMemo } from '@/modules/character-builder/presentation/stats/gritChip';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('GritChip', () => {
  it('renders grit label and value', () => {
    const patch = vi.fn();
    render(
      <GritChipMemo
        gritCurrent={3}
        gritMax={5}
        isUnlocked={() => false}
        toggle={vi.fn()}
        patch={patch}
        spendGrit={vi.fn()}
        restoreGrit={vi.fn()}
      />,
    );
    expect(screen.getByText('grit')).toBeInTheDocument();
    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  it('shows spend button disabled when grit is 0', () => {
    const patch = vi.fn();
    render(
      <GritChipMemo
        gritCurrent={0}
        gritMax={5}
        isUnlocked={() => false}
        toggle={vi.fn()}
        patch={patch}
        spendGrit={vi.fn()}
        restoreGrit={vi.fn()}
      />,
    );
    const spendBtn = screen.getByLabelText('gritSpend');
    expect(spendBtn).toBeDisabled();
  });

  it('shows restore button disabled at max grit', () => {
    const patch = vi.fn();
    render(
      <GritChipMemo
        gritCurrent={5}
        gritMax={5}
        isUnlocked={() => false}
        toggle={vi.fn()}
        patch={patch}
        spendGrit={vi.fn()}
        restoreGrit={vi.fn()}
      />,
    );
    const restoreBtn = screen.getByLabelText('gritRestore');
    expect(restoreBtn).toBeDisabled();
  });

  it('shows inputs when unlocked', () => {
    const patch = vi.fn();
    render(
      <GritChipMemo
        gritCurrent={3}
        gritMax={5}
        isUnlocked={() => true}
        toggle={vi.fn()}
        patch={patch}
        spendGrit={vi.fn()}
        restoreGrit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('gritCurrent')).toBeInTheDocument();
    expect(screen.getByLabelText('gritMax')).toBeInTheDocument();
  });
});
