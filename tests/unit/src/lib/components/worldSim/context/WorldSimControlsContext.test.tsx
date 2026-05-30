/**
 * @fileoverview WorldSimControlsContext Unit Tests
 * @description Verifies that the controls provider proxies calls to the
 * mediator ref, handles a null mediator gracefully, and that consuming
 * outside the provider throws.
 *
 * @module tests/unit/worldSim/context/WorldSimControlsContext
 */

import {
  useWorldSimControls,
  WorldSimControlsProvider,
} from '@/lib/components/worldSim/context/WorldSimControlsContext';
import type { WorldSimMediator } from '@/lib/components/worldSim/WorldSimMediator';
import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

function createMediatorMock() {
  return {
    zoomToBody: vi.fn(),
    zoomToRegion: vi.fn(),
    zoomToLocalCoordinate: vi.fn(),
    resetView: vi.fn(),
    toggleOrbitLines: vi.fn(),
  };
}

describe('WorldSimControlsContext', () => {
  it('proxies every control method to the current mediator', () => {
    const mediator = createMediatorMock();
    const mediatorRef = {
      current: mediator as unknown as WorldSimMediator,
    };

    let captured: ReturnType<typeof useWorldSimControls> | null = null;
    function Probe() {
      captured = useWorldSimControls();
      return null;
    }

    render(
      <WorldSimControlsProvider mediatorRef={mediatorRef}>
        <Probe />
      </WorldSimControlsProvider>,
    );

    expect(captured).not.toBeNull();
    captured!.zoomToBody('planet-1');
    captured!.zoomToRegion('planet-1', 'reg-a');
    captured!.zoomToLocalCoordinate('planet-1', { lat: 1, lon: 2 }, 5);
    captured!.resetView();
    captured!.toggleOrbitLines();

    expect(mediator.zoomToBody).toHaveBeenCalledWith('planet-1');
    expect(mediator.zoomToRegion).toHaveBeenCalledWith('planet-1', 'reg-a');
    expect(mediator.zoomToLocalCoordinate).toHaveBeenCalledWith(
      'planet-1',
      { lat: 1, lon: 2 },
      5,
    );
    expect(mediator.resetView).toHaveBeenCalledTimes(1);
    expect(mediator.toggleOrbitLines).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when the mediator ref is null', () => {
    const mediatorRef = { current: null };

    let captured: ReturnType<typeof useWorldSimControls> | null = null;
    function Probe() {
      captured = useWorldSimControls();
      return null;
    }

    render(
      <WorldSimControlsProvider mediatorRef={mediatorRef}>
        <Probe />
      </WorldSimControlsProvider>,
    );

    expect(() => captured!.zoomToBody('x')).not.toThrow();
    expect(() => captured!.resetView()).not.toThrow();
    expect(() => captured!.toggleOrbitLines()).not.toThrow();
  });

  it('reads mediatorRef.current lazily so late-bound mediators work', () => {
    const mediatorRef: {
      current: WorldSimMediator | null;
    } = { current: null };

    let captured: ReturnType<typeof useWorldSimControls> | null = null;
    function Probe() {
      captured = useWorldSimControls();
      return null;
    }

    render(
      <WorldSimControlsProvider mediatorRef={mediatorRef}>
        <Probe />
      </WorldSimControlsProvider>,
    );

    const mediator = createMediatorMock();
    mediatorRef.current = mediator as unknown as WorldSimMediator;

    captured!.resetView();
    expect(mediator.resetView).toHaveBeenCalledTimes(1);
  });

  it('throws when used outside the provider', () => {
    function Probe() {
      useWorldSimControls();
      return null;
    }

    const originalError = console.error;
    console.error = () => {};
    try {
      expect(() => render(<Probe />)).toThrow(
        /useWorldSimControls must be used within a WorldSimControlsProvider/,
      );
    } finally {
      console.error = originalError;
    }
  });
});
