/**
 * @fileoverview TierChip Unit Tests
 * @description Smoke tests for the Tier combat stat chip.
 *
 * @module tests/unit/src/modules/character-builder/presentation/stats/tierChip.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { TierChipMemo } from '@/modules/character-builder/presentation/stats/tierChip';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('TierChip', () => {
  it('renders tier label and formatted bonus', () => {
    const patch = vi.fn();
    render(
      <TierChipMemo
        tierBonus={2}
        tierStr='+2'
        isUnlocked={() => false}
        toggle={vi.fn()}
        patch={patch}
      />,
    );
    expect(screen.getByText('tierShort')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('shows input when unlocked', () => {
    const patch = vi.fn();
    render(
      <TierChipMemo
        tierBonus={2}
        tierStr='+2'
        isUnlocked={() => true}
        toggle={vi.fn()}
        patch={patch}
      />,
    );
    expect(screen.getByLabelText('tierShort')).toBeInTheDocument();
  });
});
