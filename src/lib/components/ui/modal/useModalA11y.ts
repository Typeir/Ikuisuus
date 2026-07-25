/**
 * @fileoverview Modal accessibility hook
 * @description Shared focus-trap, focus-restore, and modal-stacking behaviour for
 * `Modal` and `MobileModal`. A single global stack ensures only the top-most modal
 * responds to Escape and traps Tab, body scroll-lock is reference-counted across
 * nested modals, and every modal below the top is made `inert` (background gating).
 * Focus moves into the modal on open and returns to the triggering element on close.
 *
 * @module ui/modal/useModalA11y
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { useEffect, useId, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * One modal's presence on the global stack.
 *
 * @interface ModalStackEntry
 * @property {string} id - Stable identifier for this modal instance
 * @property {HTMLElement | null} overlay - The portal overlay element to gate when not top
 */
interface ModalStackEntry {
  id: string;
  overlay: HTMLElement | null;
}

const modalStack: ModalStackEntry[] = [];
let savedBodyOverflow = '';

/**
 * Applies or clears `inert` + `aria-hidden` so only the top-of-stack modal is
 * interactive; every modal beneath it is gated from pointer, focus, and AT.
 *
 * @function syncModalInert
 * @returns {void}
 */
function syncModalInert(): void {
  modalStack.forEach((entry, index) => {
    if (!entry.overlay) return;
    const isTop = index === modalStack.length - 1;
    if (isTop) {
      entry.overlay.removeAttribute('inert');
      entry.overlay.removeAttribute('aria-hidden');
    } else {
      entry.overlay.setAttribute('inert', '');
      entry.overlay.setAttribute('aria-hidden', 'true');
    }
  });
}

/**
 * Pushes a modal onto the global stack, locking body scroll on the first entry.
 *
 * @function pushModal
 * @param {ModalStackEntry} entry - The modal's id and overlay element
 * @returns {void}
 */
function pushModal(entry: ModalStackEntry): void {
  if (modalStack.length === 0) {
    savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  modalStack.push(entry);
  syncModalInert();
}

/**
 * Removes a modal from the global stack, restoring body scroll when it empties.
 *
 * @function popModal
 * @param {string} id - The modal id to remove
 * @returns {void}
 */
function popModal(id: string): void {
  const index = modalStack.findIndex((entry) => entry.id === id);
  if (index !== -1) modalStack.splice(index, 1);
  if (modalStack.length === 0) document.body.style.overflow = savedBodyOverflow;
  syncModalInert();
}

/**
 * Whether the given modal id is the top-most (interactive) modal.
 *
 * @function isTopModal
 * @param {string} id - The modal id
 * @returns {boolean} True when this modal is on top of the stack
 */
function isTopModal(id: string): boolean {
  return modalStack.length > 0 && modalStack[modalStack.length - 1].id === id;
}

/**
 * Refs returned by {@link useModalA11y} to spread onto the modal elements.
 *
 * @interface ModalA11y
 * @property {RefObject<HTMLDivElement | null>} overlayRef - Ref for the portal overlay (gated when not top)
 * @property {RefObject<HTMLDivElement | null>} contentRef - Ref for the focus-trapped content container
 */
export interface ModalA11y {
  overlayRef: RefObject<HTMLDivElement>;
  contentRef: RefObject<HTMLDivElement>;
}

/**
 * Wires modal accessibility for a controlled modal: focus trap, initial focus,
 * focus restore to the trigger, top-of-stack Escape handling, reference-counted
 * body scroll-lock, and `inert` gating of lower modals. Attach the returned refs
 * to the overlay and content elements; give the content element `tabIndex={-1}`
 * so it can receive focus when it holds no focusable children.
 *
 * @function useModalA11y
 * @param {boolean} isOpen - Whether the modal is currently open
 * @param {() => void} onClose - Called when the top modal requests close (Escape)
 * @returns {ModalA11y} Refs for the overlay and content elements
 */
export function useModalA11y(isOpen: boolean, onClose: () => void): ModalA11y {
  const id = useId();
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const trigger = document.activeElement as HTMLElement | null;
    pushModal({ id, overlay: overlayRef.current });

    const container = contentRef.current;
    if (container) {
      const initial =
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      (initial[0] ?? container).focus();
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!isTopModal(id)) return;
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !contentRef.current) return;
      const focusable =
        contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const outside = !contentRef.current.contains(active);
      if (event.shiftKey && (active === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      popModal(id);
      trigger?.focus?.();
    };
  }, [isOpen, id]);

  return { overlayRef, contentRef };
}
