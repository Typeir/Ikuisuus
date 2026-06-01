/**
 * @fileoverview OverlayContainer Unit Tests
 * @description Tests label rendering, bind/unbind callbacks, click handling,
 * and visibility conditions based on WorldSim state.
 *
 * @module tests/unit/worldSim/overlay/OverlayContainer
 */

import {
    WorldSimProvider,
    useWorldSimDispatch,
} from '@/modules/world-sim/application/state/WorldSimContext';
import { WorldSimActionType } from '@/modules/world-sim/application/state/worldSimTypes';
import { OverlayContainer } from '@/modules/world-sim/presentation/overlay/OverlayContainer/OverlayContainer';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** Mock CelestialRegistry to return a controlled set of bodies */
vi.mock('@/modules/world-sim/domain/celestials/celestialRegistry', () => ({
  CelestialRegistry: {
    shared: () => ({
      getAllBodies: () => [
        { id: 'body-a', name: 'Body A', type: 'planet' },
        { id: 'body-b', name: 'Body B', type: 'star' },
      ],
    }),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

/** Wrapper that initializes state so labels become visible */
function InitializeWrapper({ children }: { children: React.ReactNode }) {
  const dispatch = useWorldSimDispatch();
  React.useEffect(() => {
    dispatch({ type: WorldSimActionType.Initialize });
  }, [dispatch]);
  return <>{children}</>;
}

/** Standard props factory */
function createProps(
  overrides?: Partial<React.ComponentProps<typeof OverlayContainer>>,
) {
  return {
    bindElement: vi.fn(),
    unbindElement: vi.fn(),
    mediatorRef: {
      current: { zoomToBody: vi.fn() },
    } as React.MutableRefObject<any>,
    ...overrides,
  };
}

describe('OverlayContainer', () => {
  it('renders empty container when not initialized', () => {
    const props = createProps();
    const { container } = render(
      <WorldSimProvider>
        <OverlayContainer {...props} />
      </WorldSimProvider>,
    );

    expect(container.querySelectorAll('button').length).toBe(0);
  });

  it('renders labels for all bodies when initialized and labels visible', () => {
    const props = createProps();
    render(
      <WorldSimProvider>
        <InitializeWrapper>
          <OverlayContainer {...props} />
        </InitializeWrapper>
      </WorldSimProvider>,
    );

    /** Two bodies → two label buttons */
    expect(screen.getAllByRole('button').length).toBe(2);
  });

  it('calls mediator.zoomToBody on label click', async () => {
    const user = userEvent.setup();
    const props = createProps();
    render(
      <WorldSimProvider>
        <InitializeWrapper>
          <OverlayContainer {...props} />
        </InitializeWrapper>
      </WorldSimProvider>,
    );

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);

    expect(props.mediatorRef.current.zoomToBody).toHaveBeenCalledWith('body-a');
  });

  it('calls bindElement via ref callback for each label', () => {
    const props = createProps();
    render(
      <WorldSimProvider>
        <InitializeWrapper>
          <OverlayContainer {...props} />
        </InitializeWrapper>
      </WorldSimProvider>,
    );

    /** Each body triggers bindElement via the ref callback */
    expect(props.bindElement).toHaveBeenCalledTimes(2);
    expect(props.bindElement).toHaveBeenCalledWith(
      'body-a',
      expect.any(HTMLElement),
    );
    expect(props.bindElement).toHaveBeenCalledWith(
      'body-b',
      expect.any(HTMLElement),
    );
  });
});
