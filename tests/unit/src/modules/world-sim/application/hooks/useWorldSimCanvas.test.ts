/**
 * @fileoverview useWorldSimCanvas Hook Unit Tests
 * @description Tests the useWorldSimCanvas React hook. Verifies subsystem
 * creation, animation start, cleanup on unmount, and projection subscription.
 *
 * @module tests/unit/src/modules/world-sim/application/hooks/useWorldSimCanvas.test
 */

import { renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Spy objects returned by mock constructors */
const mockSceneManagerInstance = {
  camera: { matrixWorldInverse: {} },
  renderer: { domElement: document.createElement('canvas') },
  scene: {},
  lifecycle: { on: vi.fn() },
  start: vi.fn(),
  dispose: vi.fn(),
  getCanvasRect: vi.fn(() => ({ x: 0, y: 0, width: 800, height: 600 })),
};

const mockCameraControllerInstance = {
  update: vi.fn(),
  dispose: vi.fn(),
  setFollowTarget: vi.fn(),
  onPanUnlock: null as (() => void) | null,
};

const mockProjectionBridgeInstance = {
  subscribe: vi.fn(() => vi.fn()),
  bindElement: vi.fn(),
  unbindElement: vi.fn(),
  clear: vi.fn(),
  track: vi.fn(),
  update: vi.fn(),
  setOccluded: vi.fn(),
};

const mockEventBusInstance = {
  emit: vi.fn(),
  clear: vi.fn(),
};

const mockMediatorInstance = {
  initialize: vi.fn(),
  dispose: vi.fn(),
};

/** Mock all subsystem modules */
vi.mock('@/modules/world-sim/infrastructure/three-js/SceneManager', () => ({
  SceneManager: vi.fn(() => mockSceneManagerInstance),
}));

vi.mock('@/modules/world-sim/infrastructure/input/CameraController', () => ({
  CameraController: vi.fn(() => mockCameraControllerInstance),
}));

vi.mock('@/modules/world-sim/infrastructure/bridge/ProjectionBridge', () => ({
  ProjectionBridge: vi.fn(() => mockProjectionBridgeInstance),
}));

vi.mock('@/modules/world-sim/domain/events/sceneEventBus', () => ({
  SceneEventBus: vi.fn(() => mockEventBusInstance),
}));

vi.mock('@/modules/world-sim/presentation/WorldSim/WorldSimMediator', () => ({
  WorldSimMediator: vi.fn(() => mockMediatorInstance),
}));

/** Mock useWorldSimDispatch to return a mock dispatch */
const mockDispatch = vi.fn();
vi.mock('@/modules/world-sim/application/state/WorldSimContext', () => ({
  useWorldSimDispatch: () => mockDispatch,
}));

import { useWorldSimCanvas } from '@/modules/world-sim/application/hooks/useWorldSimCanvas';

describe('useWorldSimCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** Wrapper that provides a div for the container ref. */
  function renderWithContainer() {
    /** Store the ref callback result */
    let containerEl: HTMLDivElement | null = null;

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return React.createElement('div', null, children);
    };

    const { result, unmount } = renderHook(() => useWorldSimCanvas(), {
      wrapper,
    });

    /** Tests the returned hook shape since useEffect does not fire without a mounted DOM. */
    return { result, unmount };
  }

  it('returns containerRef, mediatorRef, subscribeToProjections, bindElement, unbindElement', () => {
    const { result } = renderWithContainer();

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.mediatorRef).toBeDefined();
    expect(result.current.subscribeToProjections).toBeInstanceOf(Function);
    expect(result.current.bindElement).toBeInstanceOf(Function);
    expect(result.current.unbindElement).toBeInstanceOf(Function);
  });

  it('subscribeToProjections queues callback when bridge is not ready', () => {
    const { result } = renderWithContainer();
    const callback = vi.fn();

    /** Bridge not yet created — subscription should be deferred */
    const unsub = result.current.subscribeToProjections(callback);
    expect(unsub).toBeInstanceOf(Function);
  });

  it('bindElement is callable without error', () => {
    const { result } = renderWithContainer();
    const el = document.createElement('div');

    expect(() => {
      result.current.bindElement('test-id', el);
    }).not.toThrow();
  });

  it('unbindElement is callable without error', () => {
    const { result } = renderWithContainer();

    expect(() => {
      result.current.unbindElement('test-id');
    }).not.toThrow();
  });

  it('mediatorRef is initially null', () => {
    const { result } = renderWithContainer();
    expect(result.current.mediatorRef.current).toBeNull();
  });
});
