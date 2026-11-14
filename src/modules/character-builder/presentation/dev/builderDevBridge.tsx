/**
 * @fileoverview Dev-only bridge that exposes live builder state as `window.ik.builder` for Playwright and agents.
 *
 * @module modules/character-builder/presentation/dev/builderDevBridge
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

'use client';

import { registerIkModule, unregisterIkModule, type IkBuilderDebug } from '@/lib/debug/ik';
import { useCharacterSheetDispatch } from '@/lib/context/CharacterSheetContext';
import type { CharacterSheet } from '@/lib/types/character';
import { CHARACTER_SHEET_ACTION_TYPES } from '@/lib/types/characterSheet';
import { pendingBuilderTasks, subscribeBuilderActivity } from '@/modules/character-builder/application/builderCore/builderActivity';
import { diffFlags, diffJson } from '@/modules/character-builder/application/builderCore/builderDiff';
import { computeBuilderFlags } from '@/modules/character-builder/application/builderCore/builderFlags';
import { computeBuilderState } from '@/modules/character-builder/application/builderCore/builderState';
import type {
  BuilderPayload,
  BuilderSlot,
  BuilderSnapshot,
} from '@/modules/character-builder/application/builderCore/types';
import {
  useActiveSheet,
  useSheetData,
} from '@/modules/character-builder/application/context/activeSheetContext';
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Quiet time after the last state change before the builder counts as settled, in ms.
 *
 * @constant SETTLE_QUIET_MS
 * @type {number}
 */
export const SETTLE_QUIET_MS = 120;

/**
 * Default settle timeout, in ms.
 *
 * @constant SETTLE_TIMEOUT_MS
 * @type {number}
 */
export const SETTLE_TIMEOUT_MS = 10000;

/**
 * Resolves on the next animation frame.
 *
 * @function nextFrame
 * @returns {Promise<void>} Frame promise
 */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Polls a predicate every frame until true.
 *
 * @async
 * @function waitUntil
 * @param {() => boolean} predicate - Condition
 * @param {number} timeoutMs - Timeout in ms
 * @param {string} label - Timeout message label
 * @returns {Promise<void>}
 * @throws {Error} When the timeout passes first
 */
async function waitUntil(
  predicate: () => boolean,
  timeoutMs: number,
  label: string,
): Promise<void> {
  const deadline = performance.now() + timeoutMs;
  while (!predicate()) {
    if (performance.now() > deadline) {
      throw new Error(`window.ik.builder: timed out waiting for ${label}`);
    }
    await nextFrame();
  }
}

/**
 * Posts JSON to a dev builder endpoint.
 *
 * @async
 * @function postDevApi
 * @param {string} path - Endpoint path under `/api/dev/builder/`
 * @param {Record<string, unknown>} body - JSON body
 * @returns {Promise<Record<string, unknown>>} Parsed response
 * @throws {Error} On a non-2xx response
 */
async function postDevApi(
  path: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/dev/builder/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(`POST /api/dev/builder/${path} ${res.status}: ${String(json.error)}`);
  }
  return json;
}

/**
 * Builds a snapshot of a character.
 *
 * @function snapshotOf
 * @param {CharacterSheet} character - Character
 * @returns {BuilderSnapshot} Snapshot
 */
function snapshotOf(character: CharacterSheet): BuilderSnapshot {
  return {
    character,
    state: computeBuilderState(character),
    flags: computeBuilderFlags(character),
  };
}

/**
 * Returns the live bridge, which may be a newer instance after a remount.
 *
 * @function liveBridge
 * @returns {IkBuilderDebug | undefined} Registered bridge
 */
function liveBridge(): IkBuilderDebug | undefined {
  return typeof window === 'undefined' ? undefined : window.ik?.builder;
}

/**
 * Registers `window.ik.builder` and renders a hidden settle marker.
 *
 * @component
 * @returns {JSX.Element} Hidden marker carrying `data-settled`
 */
export const BuilderDevBridge: React.FC = () => {
  const data = useSheetData();
  const { editing, mutators } = useActiveSheet();
  const dispatchRoster = useCharacterSheetDispatch();
  const dataRef = useRef(data);
  const editingRef = useRef(editing);
  const mutatorsRef = useRef(mutators);
  const lastChangeRef = useRef(0);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    dataRef.current = data;
    lastChangeRef.current = performance.now();
    setSettled(false);
  }, [data]);

  useEffect(() => {
    editingRef.current = editing;
    mutatorsRef.current = mutators;
  }, [editing, mutators]);

  useEffect(() => subscribeBuilderActivity(() => setSettled(false)), []);

  useEffect(() => {
    if (settled) return;
    let cancelled = false;
    const check = (): void => {
      if (cancelled) return;
      const quiet = performance.now() - lastChangeRef.current >= SETTLE_QUIET_MS;
      if (quiet && pendingBuilderTasks() === 0) setSettled(true);
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
    return () => {
      cancelled = true;
    };
  }, [settled]);

  const api = useMemo<IkBuilderDebug>(() => {
    const isSettled = (): boolean =>
      pendingBuilderTasks() === 0 &&
      performance.now() - lastChangeRef.current >= SETTLE_QUIET_MS;
    const whenSettled = (timeoutMs = SETTLE_TIMEOUT_MS): Promise<void> =>
      waitUntil(isSettled, timeoutMs, 'settle');
    const load = async (character: CharacterSheet): Promise<BuilderSnapshot> => {
      if (editingRef.current) mutatorsRef.current.cancelEdit();
      dispatchRoster({
        type: CHARACTER_SHEET_ACTION_TYPES.UPSERT_CHARACTER,
        payload: { character },
      });
      dispatchRoster({
        type: CHARACTER_SHEET_ACTION_TYPES.SET_ACTIVE_ID,
        payload: { id: character.id },
      });
      await waitUntil(
        () => liveBridge()?.getCharacter().id === character.id,
        SETTLE_TIMEOUT_MS,
        `character ${character.id}`,
      );
      const bridge = liveBridge() as IkBuilderDebug;
      await bridge.whenSettled();
      return snapshotOf(bridge.getCharacter());
    };
    return {
      getCharacter: () => dataRef.current,
      getState: (carry) => computeBuilderState(dataRef.current, carry),
      getFlags: (carry) => computeBuilderFlags(dataRef.current, carry),
      patch: async (partial) => {
        const prior = dataRef.current;
        const before = snapshotOf(prior);
        mutatorsRef.current.patch(partial);
        lastChangeRef.current = performance.now();
        await waitUntil(() => dataRef.current !== prior, SETTLE_TIMEOUT_MS, 'commit');
        await whenSettled();
        const after = snapshotOf(dataRef.current);
        return {
          ...after,
          diff: {
            character: diffJson(before.character, after.character),
            state: diffJson(before.state, after.state),
            flags: diffFlags(before.flags, after.flags),
          },
        };
      },
      load,
      create: async (payload: BuilderPayload, options = {}) => {
        const built = await postDevApi('create', { payload, ...options });
        const snapshot = await load(built.character as CharacterSheet);
        return { ...snapshot, resolution: built.resolution, notes: built.notes };
      },
      options: (slot: BuilderSlot, vocationIndex?: number) =>
        postDevApi('options', { slot, vocationIndex, character: dataRef.current }),
      edit: () => mutatorsRef.current.beginEdit(),
      save: () => mutatorsRef.current.saveEdit(),
      cancel: () => mutatorsRef.current.cancelEdit(),
      isSettled,
      whenSettled,
    };
  }, [dispatchRoster]);

  useEffect(() => {
    registerIkModule('builder', api);
    return () => {
      if (liveBridge() === api) unregisterIkModule('builder');
    };
  }, [api]);

  return (
    <span
      hidden
      data-testid='builder-settled'
      data-settled={settled ? 'true' : 'false'}
    />
  );
};
