/**
 * @fileoverview CharacterSheetHeaderMeta Unit Tests
 * @description Smoke tests for the level/XP/vocation-pill meta row extracted
 * from the character sheet header.
 *
 * @module tests/unit/src/lib/components/characterSheet/characterSheetHeaderMeta
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

import { CharacterSheetHeaderMeta } from '@/lib/components/characterSheet/characterSheetHeaderMeta';
import { createEmptyCharacter } from '@/lib/utils/characterStorage';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const renderMeta = (
  overrides: Partial<
    React.ComponentProps<typeof CharacterSheetHeaderMeta>
  > = {},
) =>
  render(
    <CharacterSheetHeaderMeta
      data={createEmptyCharacter()}
      editing={false}
      locale='en'
      experience={0}
      xpInput={0}
      hasActiveVocations={false}
      levelMismatch={false}
      vocationLevelSum={0}
      globalLevel={1}
      onLevelChange={vi.fn()}
      onXpChange={vi.fn()}
      {...overrides}
    />,
  );

describe('CharacterSheetHeaderMeta', () => {
  it('renders the level label in view mode', () => {
    renderMeta({ globalLevel: 5 });
    expect(screen.getByText('levelFull')).toBeTruthy();
  });

  it('renders the level mismatch chip when levels disagree', () => {
    renderMeta({
      hasActiveVocations: true,
      levelMismatch: true,
      vocationLevelSum: 4,
      globalLevel: 6,
    });
    expect(screen.getByText('levelMismatchChip')).toBeTruthy();
  });

  it('does not render the mismatch chip when levels match', () => {
    renderMeta({
      hasActiveVocations: true,
      levelMismatch: false,
      vocationLevelSum: 5,
      globalLevel: 5,
    });
    expect(screen.queryByText('levelMismatchChip')).toBeNull();
  });

  it('renders an editable level input in edit mode', () => {
    renderMeta({ editing: true });
    expect(screen.getByLabelText(/ariaLevelInput/i)).toBeTruthy();
  });
});
