/**
 * @fileoverview CharacterSheetHeaderMeta Unit Tests
 * @description Smoke tests for the level/XP/vocation-pill meta row extracted
 * from the character sheet header.
 *
 * @module tests/unit/src/lib/components/characterSheet/characterSheetHeaderMeta
 * @version 2.0.0
 * @author Typeir
 * @since 6.0.0
 */

import { CharacterSheetHeaderMeta } from '@/lib/components/characterSheet/characterSheetHeaderMeta';
import { CharacterSheetEditProvider } from '@/lib/context/CharacterSheetEditContext';
import type { CharacterSheet } from '@/lib/types/character';
import { createEmptyCharacter } from '@/lib/utils/characterStorage';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

interface RenderOptions {
  data?: Partial<CharacterSheet>;
  editing?: boolean;
  locale?: string;
  xpInput?: number;
}

const renderMeta = ({
  data: dataOverrides = {},
  editing = false,
  locale = 'en',
  xpInput = 0,
}: RenderOptions = {}) => {
  const base = createEmptyCharacter();
  const data: CharacterSheet = { ...base, ...dataOverrides };
  return render(
    <CharacterSheetEditProvider
      data={data}
      editing={editing}
      onChange={vi.fn()}
      locale={locale}>
      <CharacterSheetHeaderMeta
        xpInput={xpInput}
        onLevelChange={vi.fn()}
        onXpChange={vi.fn()}
      />
    </CharacterSheetEditProvider>,
  );
};

describe('CharacterSheetHeaderMeta', () => {
  it('renders the level label in view mode', () => {
    renderMeta({ data: { level: 5 } });
    expect(screen.getByText('levelFull')).toBeTruthy();
  });

  it('renders the level mismatch chip when levels disagree', () => {
    renderMeta({
      data: {
        level: 6,
        vocations: [
          {
            slug: 'fighter',
            title: 'Fighter',
            level: 4,
            specializationSlug: '',
            specializationTitle: '',
            vocationFeatures: [],
            specializationFeatures: [],
          },
        ],
      },
    });
    expect(screen.getByText('levelMismatchChip')).toBeTruthy();
  });

  it('does not render the mismatch chip when levels match', () => {
    renderMeta({
      data: {
        level: 5,
        vocations: [
          {
            slug: 'fighter',
            title: 'Fighter',
            level: 5,
            specializationSlug: '',
            specializationTitle: '',
            vocationFeatures: [],
            specializationFeatures: [],
          },
        ],
      },
    });
    expect(screen.queryByText('levelMismatchChip')).toBeNull();
  });

  it('renders an editable level input in edit mode', () => {
    renderMeta({ editing: true });
    expect(screen.getByLabelText(/ariaLevelInput/i)).toBeTruthy();
  });
});
