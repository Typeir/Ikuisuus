/**
 * @fileoverview SpeedChip Unit Tests
 * @description Smoke tests for the Speed combat stat chip.
 *
 * @module tests/unit/character-builder/presentation/stats/speedChip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { SpeedChipMemo } from '@/modules/character-builder/presentation/stats/speedChip';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('SpeedChip', () => {
  it('renders speed label and display value', () => {
    const patch = vi.fn();
    render(
      <SpeedChipMemo
        speedOverride={30}
        bloodlineSpeeds={['30 ft.']}
        speedDisplay='30 ft.'
        isUnlocked={() => false}
        toggle={vi.fn()}
        patch={patch}
      />,
    );
    expect(screen.getByText('speed')).toBeInTheDocument();
    expect(screen.getByText('30 ft.')).toBeInTheDocument();
  });

  it('shows em dash when no override', () => {
    const patch = vi.fn();
    render(
      <SpeedChipMemo
        speedOverride={null}
        bloodlineSpeeds={[]}
        speedDisplay={'\u2014'}
        isUnlocked={() => false}
        toggle={vi.fn()}
        patch={patch}
      />,
    );
    expect(screen.getByText('\u2014')).toBeInTheDocument();
  });

  it('shows input when unlocked', () => {
    const patch = vi.fn();
    render(
      <SpeedChipMemo
        speedOverride={null}
        bloodlineSpeeds={[]}
        speedDisplay={'\u2014'}
        isUnlocked={() => true}
        toggle={vi.fn()}
        patch={patch}
      />,
    );
    expect(screen.getByLabelText('speed')).toBeInTheDocument();
  });
});
