/**
 * @fileoverview Escape Dismissal
 * @description One shared Escape listener over a LIFO stack, so a press closes the
 * most recent surface only. Satisfies WCAG 2.1 SC 1.4.13 for hover content.
 *
 * @module lib/components/ui/tooltip/useEscapeDismiss
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { useEffect } from 'react';

/** Dismissal callbacks, most recently registered last. */
const stack: Array<() => void> = [];

/** Whether the shared listener is attached. */
let listening = false;

/**
 * Dismisses the most recently registered surface.
 *
 * @param {KeyboardEvent} event - Key event being handled
 * @returns {void}
 */
function handleKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || event.defaultPrevented) return;

  const dismiss = stack[stack.length - 1];
  if (!dismiss) return;

  event.preventDefault();
  dismiss();
}

/**
 * Attaches the listener on first registration, detaches it on the last.
 *
 * @returns {void}
 */
function syncListener(): void {
  if (typeof document === 'undefined') return;

  if (stack.length > 0 && !listening) {
    document.addEventListener('keydown', handleKeydown);
    listening = true;
    return;
  }

  if (stack.length === 0 && listening) {
    document.removeEventListener('keydown', handleKeydown);
    listening = false;
  }
}

/**
 * Registers a surface to be closed by Escape while it is open.
 *
 * @param {boolean} active - Whether the surface is currently open
 * @param {() => void} onDismiss - Closes the surface
 * @returns {void}
 *
 * @example
 * ```tsx
 * useEscapeDismiss(isOpen, close);
 * ```
 */
export function useEscapeDismiss(active: boolean, onDismiss: () => void): void {
  useEffect(() => {
    if (!active) return;

    const entry = () => onDismiss();
    stack.push(entry);
    syncListener();

    return () => {
      const index = stack.indexOf(entry);
      if (index !== -1) stack.splice(index, 1);
      syncListener();
    };
  }, [active, onDismiss]);
}
