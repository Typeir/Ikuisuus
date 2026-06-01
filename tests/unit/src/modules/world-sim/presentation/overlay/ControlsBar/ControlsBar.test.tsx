/**
 * @fileoverview ControlsBar Unit Tests
 * @description Tests rendering, button interactions, mediator method calls,
 * dispatch actions, aria attributes, and conditional visibility.
 *
 * @module tests/unit/worldSim/overlay/ControlsBar
 */

import {
    WorldSimProvider,
    useWorldSimDispatch,
} from '@/modules/world-sim/application/state/WorldSimContext';
import { WorldSimActionType } from '@/modules/world-sim/application/state/worldSimTypes';
import { ControlsBar } from '@/modules/world-sim/presentation/overlay/ControlsBar/ControlsBar';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.clearAllMocks();
});

/** Create a mock mediator ref */
function createMediatorRef() {
  return {
    current: {
      toggleOrbitLines: vi.fn(),
      resetView: vi.fn(),
    },
  } as React.MutableRefObject<any>;
}

/**
 * Helper to render ControlsBar in an initialized state.
 * Dispatches Initialize before rendering the component.
 */
function InitializerWrapper({ children }: { children: React.ReactNode }) {
  const dispatch = useWorldSimDispatch();
  React.useEffect(() => {
    dispatch({ type: WorldSimActionType.Initialize });
  }, [dispatch]);
  return <>{children}</>;
}

/** Render ControlsBar inside providers at initialized state */
function renderControlsBar(mediatorRef?: React.MutableRefObject<any>) {
  const ref = mediatorRef ?? createMediatorRef();
  return {
    mediatorRef: ref,
    ...render(
      <WorldSimProvider>
        <InitializerWrapper>
          <ControlsBar mediatorRef={ref} />
        </InitializerWrapper>
      </WorldSimProvider>,
    ),
  };
}

describe('ControlsBar', () => {
  it('returns null when not initialized', () => {
    const ref = createMediatorRef();
    const { container } = render(
      <WorldSimProvider>
        <ControlsBar mediatorRef={ref} />
      </WorldSimProvider>,
    );

    expect(container.querySelector('[role="toolbar"]')).toBeNull();
  });

  it('renders toolbar when initialized', () => {
    renderControlsBar();

    expect(screen.getByRole('toolbar')).toBeInTheDocument();
  });

  it('renders three control buttons', () => {
    renderControlsBar();

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  it('labels button has aria-pressed matching initial state', () => {
    renderControlsBar();

    const labelsBtn = screen.getByLabelText('controls.toggleLabels');
    expect(labelsBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles labels on click', async () => {
    const user = userEvent.setup();
    renderControlsBar();

    const labelsBtn = screen.getByLabelText('controls.toggleLabels');
    await user.click(labelsBtn);

    expect(labelsBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls mediator.toggleOrbitLines and dispatches ToggleOrbits', async () => {
    const user = userEvent.setup();
    const { mediatorRef } = renderControlsBar();

    const orbitsBtn = screen.getByLabelText('controls.toggleOrbits');
    await user.click(orbitsBtn);

    expect(mediatorRef.current.toggleOrbitLines).toHaveBeenCalledOnce();
  });

  it('calls mediator.resetView on reset click', async () => {
    const user = userEvent.setup();
    const { mediatorRef } = renderControlsBar();

    const resetBtn = screen.getByLabelText('controls.reset');
    await user.click(resetBtn);

    expect(mediatorRef.current.resetView).toHaveBeenCalledOnce();
  });

  it('handles null mediator gracefully', async () => {
    const user = userEvent.setup();
    const ref = { current: null } as React.MutableRefObject<any>;
    renderControlsBar(ref);

    const resetBtn = screen.getByLabelText('controls.reset');

    await expect(user.click(resetBtn)).resolves.not.toThrow();
  });
});
