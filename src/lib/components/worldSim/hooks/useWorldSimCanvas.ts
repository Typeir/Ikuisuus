/**
 * @fileoverview useWorldSimCanvas Hook — Three.js Lifecycle Bridge to React
 * @description Custom hook that mounts the Three.js canvas into a React ref,
 * initializes the SceneManager, CameraController, ProjectionBridge, EventBus,
 * and WorldSimMediator, and handles cleanup on unmount.
 *
 * @module worldSim/hooks/useWorldSimCanvas
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { ProjectionBridge } from '../bridge/ProjectionBridge';
import { SceneEventBus } from '../bridge/SceneEventBus';
import { CameraController } from '../camera/CameraController';
import { SceneManager } from '../canvas/SceneManager';
import type { ProjectedPosition } from '../celestials/interfaces';
import { useWorldSimDispatch } from '../context/WorldSimContext';
import { WorldSimMediator } from '../WorldSimMediator';

/**
 * Return type for the useWorldSimCanvas hook.
 *
 * @interface UseWorldSimCanvasReturn
 * @property {React.RefObject<HTMLDivElement | null>} containerRef - Ref to attach to the container div
 * @property {React.MutableRefObject<WorldSimMediator | null>} mediatorRef - Ref to the mediator for imperative access
 * @property {Function} subscribeToProjections - Subscribe to projection position updates
 */
export interface UseWorldSimCanvasReturn {
  /** @property {React.RefObject<HTMLDivElement | null>} containerRef - Container element ref */
  containerRef: React.RefObject<HTMLDivElement>;
  /** @property {React.MutableRefObject<WorldSimMediator | null>} mediatorRef - Mediator ref */
  mediatorRef: React.MutableRefObject<WorldSimMediator | null>;
  /** @property {Function} subscribeToProjections - Subscribe to 2D position updates */
  subscribeToProjections: (
    callback: (positions: Map<string, ProjectedPosition>) => void,
  ) => (() => void) | undefined;
}

/**
 * Hook that bridges the Three.js canvas lifecycle with React.
 * Mounts the renderer into the provided container ref, creates all subsystems,
 * and starts the animation loop. Cleans up everything on unmount.
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

    return () => {
      mediator.dispose();
      cameraController.dispose();
      sceneManager.dispose();
      mediatorRef.current = null;
      sceneManagerRef.current = null;
      cameraControllerRef.current = null;
      projectionBridgeRef.current = null;
      eventBusRef.current = null;
    };
  }, [dispatch]);

  const subscribeToProjections = useCallback(
    (callback: (positions: Map<string, ProjectedPosition>) => void) => {
      if (!projectionBridgeRef.current) return undefined;
      return projectionBridgeRef.current.subscribe(callback);
    },
    [],
  );

  return { containerRef, mediatorRef, subscribeToProjections };
}
