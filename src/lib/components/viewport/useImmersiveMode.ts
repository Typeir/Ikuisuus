/**
 * @fileoverview Fullscreen ("immersive") toggle for the document.
 * @description Wraps the Fullscreen API with its WebKit-prefixed variant and
 * reports whether the UA offers it at all. Chromium and Firefox on Android
 * drop the address bar entirely in this mode; iOS Safari on iPhone exposes no
 * element fullscreen, so `supported` is false there and callers hide the
 * control. Entering requires a user gesture — call `toggle` from a handler.
 *
 * @module lib/components/viewport/useImmersiveMode
 * @version 1.0.0
 * @author Typeir
 * @since 9.0.0
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Document methods the WebKit-prefixed Fullscreen API adds.
 *
 * @interface WebkitFullscreenDocument
 * @property {() => Promise<void> | void} [webkitExitFullscreen] - Prefixed exit
 * @property {Element | null} [webkitFullscreenElement] - Prefixed current element
 */
interface WebkitFullscreenDocument extends Document {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
}

/**
 * Element methods the WebKit-prefixed Fullscreen API adds.
 *
 * @interface WebkitFullscreenElement
 * @property {() => Promise<void> | void} [webkitRequestFullscreen] - Prefixed request
 */
interface WebkitFullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

/**
 * State and controls returned by {@link useImmersiveMode}.
 *
 * @interface ImmersiveMode
 * @property {boolean} supported - Whether this UA exposes the Fullscreen API
 * @property {boolean} active - Whether the document is currently fullscreen
 * @property {() => void} toggle - Enters or leaves fullscreen; needs a gesture
 */
export interface ImmersiveMode {
  supported: boolean;
  active: boolean;
  toggle: () => void;
}

/**
 * Reads the current fullscreen element across both API spellings.
 *
 * @returns {Element | null} The fullscreen element, or null
 */
const currentFullscreenElement = (): Element | null => {
  const doc = document as WebkitFullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
};

/**
 * Tracks and toggles document fullscreen.
 *
 * @returns {ImmersiveMode} Support flag, current state, and the toggle
 */
export function useImmersiveMode(): ImmersiveMode {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const root = document.documentElement as WebkitFullscreenElement;
    const available =
      typeof root.requestFullscreen === 'function' ||
      typeof root.webkitRequestFullscreen === 'function';

    setSupported(available);
    if (!available) return;

    const sync = () => setActive(currentFullscreenElement() !== null);
    sync();

    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);

    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  const toggle = useCallback(() => {
    const doc = document as WebkitFullscreenDocument;
    const root = document.documentElement as WebkitFullscreenElement;

    const request = currentFullscreenElement()
      ? (doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc)
      : (root.requestFullscreen ?? root.webkitRequestFullscreen)?.call(root);

    Promise.resolve(request).catch(() => setActive(currentFullscreenElement() !== null));
  }, []);

  return { supported, active, toggle };
}

export default useImmersiveMode;
