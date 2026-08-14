/**
 * @fileoverview Mounts the Three.js canvas into a React ref, initializes all
 * subsystems, and cleans them up on unmount.
 *
 * @module worldSim/hooks/useWorldSimCanvas
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { ProjectionBridge } from '@/modules/world-sim/infrastructure/bridge/ProjectionBridge';
import { SceneEventBus } from '@/modules/world-sim/domain/events/sceneEventBus';
import { CameraController } from '@/modules/world-sim/infrastructure/input/CameraController';
import { SceneManager } from '@/modules/world-sim/infrastructure/three-js/SceneManager';
import type { ProjectedPosition } from '@/modules/world-sim/domain/celestials/celestialBody.types';
import { useWorldSimDispatch } from '@/modules/world-sim/application/state/WorldSimContext';
import { WorldSimMediator } from '@/modules/world-sim/application/mediator/WorldSimMediator';

/**
 * Return type for useWorldSimCanvas.
 *
 * @interface UseWorldSimCanvasReturn
 * @property {React.RefObject<HTMLDivElement | null>} containerRef - Ref to attach to the container div
 * @property {React.MutableRefObject<WorldSimMediator | null>} mediatorRef - Ref to the mediator for imperative access
 * @property {Function} subscribeToProjections - Subscribe to projection position updates
 * @property {Function} bindElement - Bind a DOM element for direct transform updates
 * @property {Function} unbindElement - Unbind a DOM element from projection updates
 */
export interface UseWorldSimCanvasReturn {
  /** @property {React.RefObject<HTMLDivElement | null>} containerRef - Container element ref */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** @property {React.MutableRefObject<WorldSimMediator | null>} mediatorRef - Mediator ref */
  mediatorRef: React.MutableRefObject<WorldSimMediator | null>;
  /** @property {Function} subscribeToProjections - Subscribe to 2D position updates */
  subscribeToProjections: (
    callback: (positions: Map<string, ProjectedPosition>) => void,
  ) => (() => void) | undefined;
  /** @property {Function} bindElement - Bind a DOM element for direct transform updates */
  bindElement: (id: string, element: HTMLElement) => void;
  /** @property {Function} unbindElement - Unbind a DOM element from projection updates */
  unbindElement: (id: string) => void;
}

/**
 * Mounts the renderer into the container ref, creates all subsystems, starts
 * the animation loop, and disposes everything on unmount.
 *
 * @returns {UseWorldSimCanvasReturn} Container ref, mediator ref, and projection subscription
 *
 * @example
 * ```tsx
 * function WorldSimCanvas() {
 *   const { containerRef, mediatorRef, subscribeToProjections } = useWorldSimCanvas();
 *   return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
 * }
 * ```
 */
export function useWorldSimCanvas(): UseWorldSimCanvasReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const mediatorRef = useRef<WorldSimMediator | null>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const cameraControllerRef = useRef<CameraController | null>(null);
  const projectionBridgeRef = useRef<ProjectionBridge | null>(null);
  const eventBusRef = useRef<SceneEventBus | null>(null);

  /** @property {Set} pendingSubscribers - Queued callbacks awaiting bridge creation */
  const pendingSubscribers = useRef<
    Set<(pos: Map<string, ProjectedPosition>) => void>
  >(new Set());

  /** @property {Map} cleanupMap - Unsubscribe functions for flushed pending subscribers */
  const cleanupMap = useRef<Map<Function, () => void>>(new Map());

  const dispatch = useWorldSimDispatch();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sceneManager = new SceneManager(container);
    sceneManagerRef.current = sceneManager;

    const eventBus = new SceneEventBus();
    eventBusRef.current = eventBus;

    const cameraController = new CameraController(
      sceneManager.camera,
      sceneManager.renderer.domElement,
      eventBus,
    );
    cameraControllerRef.current = cameraController;

    const projectionBridge = new ProjectionBridge();
    projectionBridgeRef.current = projectionBridge;

    /** Flush pending subscribers that were queued before the bridge existed */
    const pending = Array.from(pendingSubscribers.current);
    for (let i = 0; i < pending.length; i++) {
      const cb = pending[i];
      const unsub = projectionBridge.subscribe(cb);
      cleanupMap.current.set(cb, unsub);
    }
    pendingSubscribers.current.clear();

    const mediator = new WorldSimMediator(
      sceneManager,
      cameraController,
      projectionBridge,
      eventBus,
      dispatch,
    );
    mediatorRef.current = mediator;

    mediator.initialize();
    sceneManager.start();

    const currentCleanupMap = cleanupMap.current;
    return () => {
      mediator.dispose();
      cameraController.dispose();
      sceneManager.dispose();
      mediatorRef.current = null;
      sceneManagerRef.current = null;
      cameraControllerRef.current = null;
      projectionBridgeRef.current = null;
      eventBusRef.current = null;
      currentCleanupMap.clear();
    };
  }, [dispatch]);

  const subscribeToProjections = useCallback(
    (callback: (positions: Map<string, ProjectedPosition>) => void) => {
      const bridge = projectionBridgeRef.current;

      if (bridge) {
        return bridge.subscribe(callback);
      }

      /** Bridge not ready yet — queue for deferred subscription */
      pendingSubscribers.current.add(callback);
      return () => {
        pendingSubscribers.current.delete(callback);
        const cleanup = cleanupMap.current.get(callback);
        if (cleanup) {
          cleanup();
          cleanupMap.current.delete(callback);
        }
      };
    },
    [],
  );

  /**
   * Bind a DOM element to the projection bridge for direct CSS transform updates.
   *
   * @param {string} id - Identifier matching a tracked celestial body
   * @param {HTMLElement} element - DOM element to position
   */
  const bindElement = useCallback((id: string, element: HTMLElement) => {
    projectionBridgeRef.current?.bindElement(id, element);
  }, []);

  /**
   * Unbind a DOM element from the projection bridge.
   *
   * @param {string} id - Identifier of the tracked body to unbind
   */
  const unbindElement = useCallback((id: string) => {
    projectionBridgeRef.current?.unbindElement(id);
  }, []);

  return {
    containerRef,
    mediatorRef,
    subscribeToProjections,
    bindElement,
    unbindElement,
  };
}
