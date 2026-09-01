/**
 * @fileoverview VocationSelector Unit Tests
 * @description Tests view-mode pills, edit-mode FilterSelect comboboxes,
 * multi-vocation add/remove, and bloodline selection. Write assertions read
 * the sheet from the active-sheet context.
 *
 * @module tests/unit/src/modules/character-builder/presentation/builder/vocationSelector.test
 * @version 4.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type {
    CharacterSheet as CharacterSheetType,
    VocationEntry,
} from '@/lib/types/character';
import { useSheetData } from '@/modules/character-builder/application/context/activeSheetContext';
import { VocationSelector } from '@/modules/character-builder/presentation/builder/vocationSelector';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithActiveSheet } from '@tests/setup/renderWithActiveSheet';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const MOCK_BLOODLINES = [
  {
    slug: 'empyrean',
    title: 'Empyrean',
    file: 'src/content/en/character-creation/bloodlines/empyrean.bloodline.mdx',
    boonBudget: 10,
    boons: [],
  },
];

const MOCK_VOCATIONS = [
  {
    slug: 'warrior',
    title: 'Warrior',
    file: 'src/content/en/vocations/warrior.vocation.mdx',
    features: [{ level: 1, name: 'Fighting Style' }],
  },
];

const MOCK_SPECS = [
  {
    slug: 'champion',
    title: 'Champion',
    file: 'src/content/en/vocations/warrior/champion.mdx',
    vocation: 'warrior',
    features: [{ level: 3, name: 'Improved Critical' }],
  },
];

const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Empty vocation entry for testing. */
const emptyVocation: VocationEntry = {
  slug: '',
  title: '',
  level: 1,
  specializationSlug: null,
  specializationTitle: '',
  vocationFeatures: [],
  specializationFeatures: [],
};

/** Populated vocation entry for view-mode tests. */
const warriorEntry: VocationEntry = {
  slug: 'warrior',
  title: 'Warrior',
  level: 3,
  specializationSlug: 'champion',
  specializationTitle: 'Champion',
  vocationFeatures: [],
  specializationFeatures: [],
};

/**
 * Renders the selector inside the active-sheet context and returns a live view
 * of the character the context holds.
 *
 * @function renderSelector
 * @param {Partial<CharacterSheetType>} character - Seed character overrides
 * @param {boolean} [editing] - Whether to enter edit mode after mount
 * @returns {{ current: CharacterSheetType | null }} Live view of the sheet
 */
const renderSelector = (
  character: Partial<CharacterSheetType>,
  editing = false,
): { current: CharacterSheetType | null } => {
  const captured: { current: CharacterSheetType | null } = { current: null };

  /**
   * Probe that records the character the context currently holds.
   *
   * @component
   * @returns {null} Renders nothing
   */
  const Probe: React.FC = () => {
    captured.current = useSheetData();
    return null;
  };

  renderWithActiveSheet(
    <>
      <VocationSelector />
      <Probe />
    </>,
    { character, editing },
  );
  return captured;
};

describe('VocationSelector — view mode', () => {
  it('shows dashes when nothing is selected', () => {
    renderSelector({ vocations: [] });
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('shows bloodline pill when bloodline is set', () => {
    renderSelector({
      vocations: [],
      bloodlineSlug: 'empyrean',
      bloodlineTitle: 'Empyrean',
    });
    expect(screen.getByText('Empyrean')).toBeTruthy();
  });

  it('shows combined vocation/spec/level pill in view mode', () => {
    renderSelector({
      bloodlineSlug: 'empyrean',
      bloodlineTitle: 'Empyrean',
      vocations: [warriorEntry],
    });
    expect(screen.getByText('Warrior / Champion Lv.3')).toBeTruthy();
  });

  it('does not render FilterSelect triggers in view mode', () => {
    renderSelector({ vocations: [] });
    expect(screen.queryByRole('button', { name: /colBloodline/i })).toBeNull();
  });
});

describe('VocationSelector — edit mode', () => {
  beforeEach(() => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify(MOCK_BLOODLINES), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(MOCK_VOCATIONS), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(MOCK_SPECS), { status: 200 }),
      );
  });

  it('renders bloodline FilterSelect and one vocation entry row in edit mode', async () => {
    renderSelector({ vocations: [emptyVocation] }, true);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /colBloodline/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /colVocation/i })).toBeTruthy();
      expect(
        screen.getByRole('button', { name: /colSpecialization/i }),
      ).toBeTruthy();
    });
  });

  it('writes the bloodline patch to the sheet when a bloodline is selected', async () => {
    const sheet = renderSelector({ vocations: [emptyVocation] }, true);
    await waitFor(() => screen.getByRole('button', { name: /colBloodline/i }));

    await act(async () => {
      await userEvent.click(
        screen.getByRole('button', { name: /colBloodline/i }),
      );
    });
    await act(async () => {
      await userEvent.click(screen.getByRole('option', { name: 'Empyrean' }));
    });

    await waitFor(() => {
      expect(sheet.current?.bloodlineSlug).toBe('empyrean');
      expect(sheet.current?.bloodlineTitle).toBe('Empyrean');
      expect(sheet.current?.boonBudget).toBe(10);
      expect(sheet.current?.selectedBoons).toEqual([]);
    });
  });

  it('writes the updated vocations to the sheet when a vocation is changed', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          shardType: 'vocation',
          shards: { 'Fighting Style': 'You gain a fighting style.' },
        }),
        { status: 200 },
      ),
    );
    const sheet = renderSelector({ vocations: [emptyVocation] }, true);
    await waitFor(() => screen.getByRole('button', { name: /colVocation/i }));

    await userEvent.click(screen.getByRole('button', { name: /colVocation/i }));
    await userEvent.click(screen.getByRole('option', { name: 'Warrior' }));

    await waitFor(() => {
      expect(sheet.current?.vocations[0].slug).toBe('warrior');
      expect(sheet.current?.vocations[0].title).toBe('Warrior');
    });
  });

  it('shows Add Vocation button in edit mode', async () => {
    renderSelector({ vocations: [emptyVocation] }, true);
    await waitFor(() => screen.getByRole('button', { name: /addVocation/i }));
    expect(screen.getByRole('button', { name: /addVocation/i })).toBeTruthy();
  });

  it('appends a new empty entry to the sheet when Add Vocation is clicked', async () => {
    const sheet = renderSelector({ vocations: [emptyVocation] }, true);
    await waitFor(() => screen.getByRole('button', { name: /addVocation/i }));

    await userEvent.click(screen.getByRole('button', { name: /addVocation/i }));

    await waitFor(() => {
      expect(sheet.current?.vocations).toHaveLength(2);
      expect(sheet.current?.vocations[1]).toEqual(
        expect.objectContaining({ slug: '', level: 1 }),
      );
    });
  });

  it('disables specialization trigger when vocation entry slug is empty', async () => {
    renderSelector({ vocations: [emptyVocation] }, true);
    await waitFor(() =>
      screen.getByRole('button', { name: /colSpecialization/i }),
    );
    const specBtn = screen.getByRole('button', { name: /colSpecialization/i });
    expect(specBtn).toBeDisabled();
  });
});
