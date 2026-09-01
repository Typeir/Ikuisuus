/**
 * @fileoverview Active Sheet Context Tests
 * @description Unit tests for the ActiveSheetProvider and its selector hooks.
 *
 * @module tests/unit/src/modules/character-builder/application/context/activeSheetContext.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { CharacterSheetProvider } from '@/lib/context/CharacterSheetContext';
import type { CharacterSheet } from '@/lib/types/character';
import {
    ActiveSheetProvider,
    useSheetData,
    useSheetEditing,
    useSheetMutators,
    useSheetTab,
} from '@/modules/character-builder/application/context/activeSheetContext';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Build a test character with overrides on top of `createEmptyCharacter`.
 *
 * @function makeCharacter
 * @param {Partial<CharacterSheet>} [over] - Field overrides
 * @returns {CharacterSheet} A complete character for use in tests
 */
const makeCharacter = (over: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...createEmptyCharacter(),
  ...over,
});

/**
 * Test consumer that exposes context values + mutator buttons via the DOM.
 *
 * @component
 * @returns {JSX.Element} Test rig markup
 */
function Consumer() {
  const data = useSheetData();
  const editing = useSheetEditing();
  const [tab, setTab] = useSheetTab();
  const { patch, beginEdit, saveEdit, cancelEdit, patchVocations } =
    useSheetMutators();
  return (
    <div>
      <span data-testid='name'>{data.name}</span>
      <span data-testid='level'>{data.level}</span>
      <span data-testid='pb'>{data.tierBonus}</span>
      <span data-testid='editing'>{String(editing)}</span>
      <span data-testid='tab'>{tab}</span>
      <button onClick={beginEdit}>begin</button>
      <button onClick={saveEdit}>save</button>
      <button onClick={cancelEdit}>cancel</button>
      <button onClick={() => patch({ name: 'Renamed' })}>rename</button>
      <button
        onClick={() =>
          patchVocations([
            {
              slug: 'wizard',
              title: 'Wizard',
              level: 5,
              specializationSlug: null,
              specializationTitle: '',
              vocationFeatures: [],
              specializationFeatures: [],
            },
          ])
        }>
        set-wizard
      </button>
      <button onClick={() => setTab('feats')}>tab-feats</button>
    </div>
  );
}

/**
 * Render the consumer wrapped in both the outer roster provider and the
 * inner active-sheet provider seeded with `character`.
 *
 * @function renderRig
 * @param {CharacterSheet} character - Seed character
 * @returns {ReturnType<typeof render>} React Testing Library result
 */
const renderRig = (character: CharacterSheet) =>
  render(
    <CharacterSheetProvider>
      <ActiveSheetProvider character={character}>
        <Consumer />
      </ActiveSheetProvider>
    </CharacterSheetProvider>,
  );

describe('ActiveSheetContext', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('exposes initial character data and defaults to view mode', () => {
    renderRig(makeCharacter({ name: 'Mira', level: 3 }));
    expect(screen.getByTestId('name').textContent).toBe('Mira');
    expect(screen.getByTestId('level').textContent).toBe('3');
    expect(screen.getByTestId('editing').textContent).toBe('false');
    expect(screen.getByTestId('tab').textContent).toBe('overview');
  });

  it('beginEdit toggles editing on; cancelEdit reverts draft', async () => {
    const user = userEvent.setup();
    renderRig(makeCharacter({ name: 'Mira' }));
    await user.click(screen.getByText('begin'));
    expect(screen.getByTestId('editing').textContent).toBe('true');
    await user.click(screen.getByText('rename'));
    expect(screen.getByTestId('name').textContent).toBe('Renamed');
    await user.click(screen.getByText('cancel'));
    expect(screen.getByTestId('editing').textContent).toBe('false');
    expect(screen.getByTestId('name').textContent).toBe('Mira');
  });

  it('saveEdit commits draft to character and exits edit mode', async () => {
    const user = userEvent.setup();
    renderRig(makeCharacter({ name: 'Mira' }));
    await user.click(screen.getByText('begin'));
    await user.click(screen.getByText('rename'));
    await user.click(screen.getByText('save'));
    expect(screen.getByTestId('editing').textContent).toBe('false');
    expect(screen.getByTestId('name').textContent).toBe('Renamed');
  });

  it('patchVocations recomputes level and tier bonus', async () => {
    const user = userEvent.setup();
    renderRig(makeCharacter({ name: 'Mira', level: 1 }));
    await user.click(screen.getByText('begin'));
    await user.click(screen.getByText('set-wizard'));
    expect(screen.getByTestId('level').textContent).toBe('5');
    expect(Number(screen.getByTestId('pb').textContent)).toBeGreaterThanOrEqual(
      2,
    );
  });

  it('setActiveTab updates the active tab', async () => {
    const user = userEvent.setup();
    renderRig(makeCharacter());
    await user.click(screen.getByText('tab-feats'));
    expect(screen.getByTestId('tab').textContent).toBe('feats');
  });

  it('throws when a selector hook is used outside the provider', () => {
    const consoleError = console.error;
    console.error = () => {};
    expect(() =>
      render(
        <CharacterSheetProvider>
          <Consumer />
        </CharacterSheetProvider>,
      ),
    ).toThrow(/ActiveSheetProvider/);
    console.error = consoleError;
  });
});

void act;
