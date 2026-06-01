/**
 * @fileoverview Tests for useCreatureHandlers hook
 * @module tests/encounter-planner/presentation/EncounterPlanner/useCreatureHandlers
 */

import type { Encounter } from '@/modules/encounter-planner/domain/encounters/encounter.types';
import { useCreatureHandlers } from '@/modules/encounter-planner/presentation/EncounterPlanner/useCreatureHandlers';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/modules/encounter-planner/application/factories/encounter.factory',
  () => ({
    createEmptyCreature: vi.fn(() => ({ id: 'new-c', name: 'Empty' })),
    createMultipleCreaturesFromMonster: vi.fn(() => [
      { id: 'm1', name: 'Monster' },
    ]),
  }),
);

const mockUpdateEncounter = vi.fn();
const mockSetShowImport = vi.fn();

describe('useCreatureHandlers', () => {
  it('handleAddCreature prepends a creature via updateEncounter', () => {
    const { result } = renderHook(() =>
      useCreatureHandlers(mockUpdateEncounter, 'en', mockSetShowImport),
    );
    act(() => {
      result.current.handleAddCreature();
    });
    expect(mockUpdateEncounter).toHaveBeenCalledTimes(1);
    const updater = mockUpdateEncounter.mock.calls[0][0] as (
      prev: Encounter,
    ) => Encounter;
    const fakePrev = { creatures: [] } as unknown as Encounter;
    const next = updater(fakePrev);
    expect(next.creatures).toHaveLength(1);
  });

  it('handleImportCreatures closes the importer panel', () => {
    const { result } = renderHook(() =>
      useCreatureHandlers(mockUpdateEncounter, 'en', mockSetShowImport),
    );
    const fakeMonster = { name: 'Goblin' } as never;
    act(() => {
      result.current.handleImportCreatures(fakeMonster, 1);
    });
    expect(mockSetShowImport).toHaveBeenCalledWith(false);
  });

  it('handleRemoveCreature removes by index', () => {
    const { result } = renderHook(() =>
      useCreatureHandlers(mockUpdateEncounter, 'en', mockSetShowImport),
    );
    act(() => {
      result.current.handleRemoveCreature(1);
    });
    const updater = mockUpdateEncounter.mock.calls[
      mockUpdateEncounter.mock.calls.length - 1
    ][0] as (prev: Encounter) => Encounter;
    const fakePrev = {
      creatures: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    } as unknown as Encounter;
    const next = updater(fakePrev);
    expect(next.creatures.map((c) => c.id)).toEqual(['a', 'c']);
  });
});
