/**
 * @fileoverview React context exposing WorldSimMediator control methods.
 * @description Exposes WorldSimMediator methods as a stable React context for descendant components.
 *
 * @module worldSim/context/WorldSimControlsContext
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { JSX } from 'react';
import {
  createContext,
  useContext,
  useMemo,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import type { WorldSimMediator } from '@/modules/world-sim/application/mediator/WorldSimMediator';

/**
 * Imperative control surface for the WorldSim scene.
 * All methods are no-ops while the mediator is still initializing.
 *
 * @interface WorldSimControls
 * @property {(bodyId: string) => void} zoomToBody - Focus camera on a celestial body
 * @property {(bodyId: string, regionId: string) => void} zoomToRegion - Focus camera on a region of a body
 * @property {(bodyId: string, localCoord: { lat: number; lon: number }, viewDist?: number) => void} zoomToLocalCoordinate - Focus camera on arbitrary surface coords
 * @property {() => void} resetView - Reset camera to system overview and clear selection
 * @property {() => void} toggleOrbitLines - Toggle orbit line visibility
 */
export interface WorldSimControls {
  /** @property {(bodyId: string) => void} zoomToBody - Focus camera on a body */
  zoomToBody: (bodyId: string) => void;
  /** @property {(bodyId: string, regionId: string) => void} zoomToRegion - Focus camera on a region */
  zoomToRegion: (bodyId: string, regionId: string) => void;
  /** @property {Function} zoomToLocalCoordinate - Focus on arbitrary surface coords */
  zoomToLocalCoordinate: (
    bodyId: string,
    localCoord: { lat: number; lon: number },
    viewDist?: number,
  ) => void;
  /** @property {() => void} resetView - Reset camera and deselect */
  resetView: () => void;
  /** @property {() => void} toggleOrbitLines - Toggle orbit lines */
  toggleOrbitLines: () => void;
}

/**
 * Context for the WorldSim imperative controls.
 * `null` indicates the hook is being called outside a provider.
 *
 * @constant
 */
const WorldSimControlsContext = createContext<WorldSimControls | null>(null);

/**
 * Props for {@link WorldSimControlsProvider}.
 *
 * @interface WorldSimControlsProviderProps
 * @property {MutableRefObject<WorldSimMediator | null>} mediatorRef - Mediator ref from useWorldSimCanvas
 * @property {ReactNode} children - Descendant tree that receives controls
 */
interface WorldSimControlsProviderProps {
  /** @property {MutableRefObject<WorldSimMediator | null>} mediatorRef - Mediator ref */
  mediatorRef: MutableRefObject<WorldSimMediator | null>;
  /** @property {ReactNode} children - Wrapped children */
  children: ReactNode;
}

/**
 * Provider providing a stable controls object bound to `mediatorRef`.
 * Callbacks read `mediatorRef.current` at call time; calls made before the
 * mediator initializes are silently ignored.
 *
 * @component
 * @param {WorldSimControlsProviderProps} props - Provider props
 * @returns {JSX.Element} Provider wrapping children with controls context
 */
export function WorldSimControlsProvider({
  mediatorRef,
  children,
}: WorldSimControlsProviderProps): JSX.Element {
  const controls = useMemo<WorldSimControls>(
    () => ({
      zoomToBody: (bodyId) => mediatorRef.current?.zoomToBody(bodyId),
      zoomToRegion: (bodyId, regionId) =>
        mediatorRef.current?.zoomToRegion(bodyId, regionId),
      zoomToLocalCoordinate: (bodyId, localCoord, viewDist) =>
        mediatorRef.current?.zoomToLocalCoordinate(
          bodyId,
          localCoord,
          viewDist,
        ),
      resetView: () => mediatorRef.current?.resetView(),
      toggleOrbitLines: () => mediatorRef.current?.toggleOrbitLines(),
    }),
    [mediatorRef],
  );

  return (
    <WorldSimControlsContext.Provider value={controls}>
      {children}
    </WorldSimControlsContext.Provider>
  );
}

/**
 * Access the WorldSim imperative controls.
 * Returns a stable object whose methods proxy to the current mediator.
 *
 * @function useWorldSimControls
 * @returns {WorldSimControls} Stable controls object
 * @throws {Error} If used outside a {@link WorldSimControlsProvider}
 */
export function useWorldSimControls(): WorldSimControls {
  const ctx = useContext(WorldSimControlsContext);
  if (ctx === null) {
    throw new Error(
      'useWorldSimControls must be used within a WorldSimControlsProvider',
    );
  }
  return ctx;
}
