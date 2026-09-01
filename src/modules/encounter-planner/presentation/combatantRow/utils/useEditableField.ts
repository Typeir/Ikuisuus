/**
 * @fileoverview Hook for inline-editable numeric fields.
 * @description React hook implementing an edit/commit/cancel cycle. Each
 * instance owns its editing state and shares a cancel-pending ref to
 * coordinate blur with Escape.
 *
 * @module modules/encounter-planner/presentation/combatantRow/utils/useEditableField
 * @version 1.0.0
 * @author Typeir
 * @since 4.1.0
 */

'use client';

import { useCallback, useState } from 'react';

/**
 * Return type for the useEditableField hook.
 *
 * @interface EditableField
 * @property {string | null} editing - Current editing value, or null when not editing
 * @property {(value: string) => void} setEditing - Sets the editing value directly (for onFocus)
 * @property {(value: string) => void} onChange - Input onChange handler
 * @property {() => void} commit - Commits the current editing value via the updater
 * @property {() => void} cancel - Cancels editing and sets the cancel-pending flag
 */
interface EditableField {
  editing: string | null;
  setEditing: (value: string) => void;
  onChange: (value: string) => void;
  commit: () => void;
  cancel: () => void;
}

/**
 * Hook for inline-editable numeric fields with commit/cancel semantics.
 *
 * @param {React.MutableRefObject<boolean>} cancelPendingRef - Shared ref; true prevents commit on blur
 * @param {(value: string) => void} updater - Called with the raw editing string on commit
 * @returns {EditableField} Editing state and handlers
 */
export function useEditableField(
  cancelPendingRef: React.MutableRefObject<boolean>,
  updater: (value: string) => void,
): EditableField {
  const [editing, setEditingRaw] = useState<string | null>(null);

  const setEditing = useCallback((value: string) => {
    setEditingRaw(value);
  }, []);

  const onChange = useCallback((value: string) => {
    setEditingRaw(value);
  }, []);

  const commit = useCallback(() => {
    if (cancelPendingRef.current) {
      cancelPendingRef.current = false;
      return;
    }
    if (editing === null) return;
    updater(editing);
    setEditingRaw(null);
  }, [cancelPendingRef, editing, updater]);

  const cancel = useCallback(() => {
    cancelPendingRef.current = true;
    setEditingRaw(null);
  }, [cancelPendingRef]);

  return { editing, setEditing, onChange, commit, cancel };
}
