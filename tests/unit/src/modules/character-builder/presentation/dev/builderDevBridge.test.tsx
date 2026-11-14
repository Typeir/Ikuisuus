/**
 * @fileoverview BuilderDevBridge tests.
 *
 * @module tests/unit/src/modules/character-builder/presentation/dev/builderDevBridge.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import { CharacterSheetProvider } from '@/lib/context/CharacterSheetContext';
import { ActiveSheetProvider } from '@/modules/character-builder/application/context/activeSheetContext';
import { BuilderDevBridge } from '@/modules/character-builder/presentation/dev/builderDevBridge';
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  makeCharacter,
  makeVocation,
} from '../../../../../../fixtures/builder/builderFixtures';

/**
 * Renders the bridge inside the sheet providers.
 *
 * @function renderBridge
 * @returns {ReturnType<typeof render>} Render result
 */
function renderBridge() {
  const character = makeCharacter({ name: 'Ari' });
  return render(
    <CharacterSheetProvider>
      <ActiveSheetProvider character={character}>
        <BuilderDevBridge />
      </ActiveSheetProvider>
    </CharacterSheetProvider>,
  );
}

/**
 * Waits until the hidden marker reports settled.
 *
 * @async
 * @function waitSettled
 * @returns {Promise<void>}
 */
async function waitSettled(): Promise<void> {
  await waitFor(() =>
    expect(screen.getByTestId('builder-settled')).toHaveAttribute('data-settled', 'true'),
  );
}

describe('BuilderDevBridge', () => {
  it('registers window.ik.builder with live reads', async () => {
    const { unmount } = renderBridge();
    await waitSettled();
    const bridge = window.ik.builder;
    expect(bridge?.getCharacter().name).toBe('Ari');
    expect(bridge?.getFlags().map((f) => f.code)).toEqual(['UNASSIGNED_LEVELS']);
    expect(bridge?.getState().boonPoints.spent).toBe(0);
    expect(bridge?.isSettled()).toBe(true);
    unmount();
    expect(window.ik.builder).toBeUndefined();
  });

  it('patches through the mutators and returns the diff', async () => {
    const { unmount } = renderBridge();
    await waitSettled();
    type PatchResult = Awaited<ReturnType<NonNullable<typeof window.ik.builder>['patch']>>;
    let pending: Promise<PatchResult> | undefined;
    let result: PatchResult | undefined;
    act(() => {
      pending = window.ik.builder?.patch({ vocations: [makeVocation({ level: 1 })] });
    });
    await act(async () => {
      result = await pending;
    });
    await waitSettled();
    expect(result?.character.vocations[0].slug).toBe('wizard');
    expect(result?.flags.map((f) => f.code)).not.toContain('UNASSIGNED_LEVELS');
    expect(result?.diff).toBeDefined();
    unmount();
  });
});
