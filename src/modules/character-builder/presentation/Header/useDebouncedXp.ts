/**
 * @fileoverview Debounced XP input that holds a builder task open until the write lands.
 *
 * @module modules/character-builder/presentation/Header/useDebouncedXp
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

'use client';

import { useDebounce } from '@/lib/hooks/useDebounce';
import { beginBuilderTask } from '@/modules/character-builder/application/builderCore/builderActivity';
import { useCallback, useEffect, useRef, useState } from 'react';

/** XP input debounce, in ms. */
export const XP_DEBOUNCE_MS = 300;

/**
 * Debounced XP input state.
 *
 * @interface DebouncedXp
 * @property {number} xpInput - Current input value
 * @property {(value: number | undefined) => void} onXpInput - Input change handler; opens a builder task
 */
export interface DebouncedXp {
  xpInput: number;
  onXpInput: (value: number | undefined) => void;
}

/**
 * Mirrors stored XP into an input and writes edits after {@link XP_DEBOUNCE_MS}.
 *
 * @function useDebouncedXp
 * @param {number} experience - Stored XP
 * @param {(xp: number) => void} patchExperience - XP writer
 * @returns {DebouncedXp} Input value and change handler
 */
export function useDebouncedXp(
  experience: number,
  patchExperience: (xp: number) => void,
): DebouncedXp {
  const [xpInput, setXpInput] = useState<number>(experience);
  const debouncedXp = useDebounce(xpInput, XP_DEBOUNCE_MS);
  const changedRef = useRef(false);
  const taskRef = useRef<(() => void) | null>(null);

  const endTask = useCallback(() => {
    taskRef.current?.();
    taskRef.current = null;
  }, []);

  useEffect(() => {
    setXpInput(experience);
  }, [experience]);

  useEffect(() => {
    if (!changedRef.current) return;
    changedRef.current = false;
    patchExperience(debouncedXp);
    endTask();
  }, [debouncedXp, patchExperience, endTask]);

  useEffect(() => {
    if (xpInput === debouncedXp) endTask();
  }, [xpInput, debouncedXp, endTask]);

  useEffect(() => endTask, [endTask]);

  const onXpInput = useCallback((value: number | undefined) => {
    changedRef.current = true;
    taskRef.current ??= beginBuilderTask();
    setXpInput(value ?? 0);
  }, []);

  return { xpInput, onXpInput };
}
