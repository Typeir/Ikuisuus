/**
 * @fileoverview Roster Write-Back Integration Test
 * @description Exercises the full persistence round trip the app actually runs:
 * a write lands on the sheet, the provider pushes it to the roster context, the
 * roster rebuilds the character as a fresh object, and that object flows back in
 * as the `character` prop.
 *
 * Unit fixtures mount `ActiveSheetProvider` with a fixed `character` prop, so
 * the echo never happens there and a feedback loop between the push and the
 * adopting sync goes unnoticed. This mounts the real `CharacterRoster` over a
 * persisted character, which is the stack the loop was reported from — a loop
 * surfaces as React's "Maximum update depth exceeded".
 *
 * @module tests/integration/character-builder/presentation/rosterWriteBack
 * @version 1.0.0
 * @author Typeir
 * @since 10.0.0
 */

import { CharacterSheetProvider } from '@/lib/context/CharacterSheetContext';
import type { CharacterSheet } from '@/lib/types/character';
import { CHARACTER_SHEET_STORAGE_KEY } from '@/lib/types/characterSheet';
import {
  STORAGE_SCHEMA_KEY,
  STORAGE_SCHEMA_VERSION,
  resetStorageSchemaCheck,
} from '@/lib/utils/storageSchema';
import {
  storePersistentData,
  storePersistentDataRef,
} from '@/lib/utils/storePersistentData';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { CharacterRoster } from '@/modules/character-builder/presentation/Roster/characterRoster';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<Record<string, unknown>>(),
  );
});

const SEED: CharacterSheet = {
  ...createEmptyCharacter(),
  id: 'seed-character',
  name: 'Aila',
  ac: 12,
  experience: 900,
  vocations: [
    {
      slug: 'berserker',
      title: 'Berserker',
      level: 3,
      hitDie: 12,
      specializationSlug: null,
      specializationTitle: '',
      vocationFeatures: [],
      specializationFeatures: [],
    },
  ],
};

/**
 * Persists the seed character so the provider hydrates it, exactly as a
 * returning player's browser would. Seeding through storage rather than a
 * dispatch matters: `CharacterRoster` auto-creates a character when it finds the
 * roster empty at hydration, which would take over the panel.
 *
 * @function persistSeed
 * @returns {void}
 */
const persistSeed = (): void => {
  storePersistentData(STORAGE_SCHEMA_KEY, String(STORAGE_SCHEMA_VERSION));
  storePersistentDataRef(
    CHARACTER_SHEET_STORAGE_KEY,
    JSON.stringify({ characters: [SEED], activeId: SEED.id }),
  );
};

describe('roster write-back (integration)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetStorageSchemaCheck();
    persistSeed();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('settles after a live-play write instead of looping through the roster echo', async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <CharacterSheetProvider>
          <CharacterRoster />
        </CharacterSheetProvider>
      </StrictMode>,
    );

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Aila/i })).toBeTruthy(),
    );
    expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);

    await user.click(screen.getAllByRole('button', { name: /lock/i })[1]);

    await waitFor(() =>
      expect(screen.getAllByRole('spinbutton').length).toBeGreaterThan(0),
    );
  });

  it('keeps the sheet responsive to a second live-play write', async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <CharacterSheetProvider>
          <CharacterRoster />
        </CharacterSheetProvider>
      </StrictMode>,
    );

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Aila/i })).toBeTruthy(),
    );

    const locks = () => screen.getAllByRole('button', { name: /lock/i });
    await user.click(locks()[1]);
    await waitFor(() =>
      expect(screen.getAllByRole('spinbutton').length).toBeGreaterThan(0),
    );

    await user.click(locks()[1]);
    await waitFor(() =>
      expect(screen.queryAllByRole('spinbutton')).toHaveLength(0),
    );
  });
});
