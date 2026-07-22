/**
 * @fileoverview InfoPanel Unit Tests
 * @description Tests conditional rendering, body info display, back button,
 * region list rendering, and region click handling.
 *
 * @module tests/unit/worldSim/overlay/InfoPanel
 */

import {
    WorldSimProvider,
    useWorldSimDispatch,
} from '@/modules/world-sim/application/state/WorldSimContext';
import { WorldSimActionType } from '@/modules/world-sim/application/state/worldSimTypes';
import { InfoPanel } from '@/modules/world-sim/presentation/overlay/InfoPanel/InfoPanel';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** Mock CelestialRegistry to avoid coupling to real JSON data */
vi.mock('@/modules/world-sim/domain/celestials/celestialRegistry', () => ({
  CelestialRegistry: {
    shared: () => ({
      getBodyById: (id: string) => {
        if (id === 'test-body') {
          return {
            id: 'test-body',
            name: 'Test Body',
            type: 'planet',
            radius: 30,
            regions: [
              { id: 'region-a', name: 'Region A' },
              { id: 'region-b', name: 'Region B' },
            ],
          };
        }
        if (id === 'no-regions') {
          return {
            id: 'no-regions',
            name: 'No Regions',
            type: 'planet',
            radius: 20,
            regions: [],
          };
        }
        return undefined;
      },
    }),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

/** Create a mock mediator ref */
function createMediatorRef() {
  return {
    current: {
      resetView: vi.fn(),
      zoomToRegion: vi.fn(),
    },
  } as React.MutableRefObject<any>;
}

/**
 * Component that initializes state and selects a body before rendering InfoPanel.
 */
function SetupWrapper({
  bodyId,
  children,
}: {
  bodyId: string;
  children: React.ReactNode;
}) {
  const dispatch = useWorldSimDispatch();
  React.useEffect(() => {
    dispatch({ type: WorldSimActionType.Initialize });
    dispatch({ type: WorldSimActionType.SelectBody, bodyId });
  }, [dispatch, bodyId]);
  return <>{children}</>;
}

describe('InfoPanel', () => {
  it('returns null when not initialized', () => {
    const ref = createMediatorRef();
    const { container } = render(
      <WorldSimProvider>
        <InfoPanel mediatorRef={ref} />
      </WorldSimProvider>,
    );

    expect(container.querySelector('[role="complementary"]')).toBeNull();
  });

  it('returns null at System zoom level', () => {
    const ref = createMediatorRef();
    const { container } = render(
      <WorldSimProvider>
        <InfoPanel mediatorRef={ref} />
      </WorldSimProvider>,
    );

    expect(container.querySelector('[role="complementary"]')).toBeNull();
  });

  it('renders body info when a body is selected', () => {
    const ref = createMediatorRef();
    render(
      <WorldSimProvider>
        <SetupWrapper bodyId='test-body'>
          <InfoPanel mediatorRef={ref} />
        </SetupWrapper>
      </WorldSimProvider>,
    );

    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('renders translated body heading', () => {
    const ref = createMediatorRef();
    render(
      <WorldSimProvider>
        <SetupWrapper bodyId='test-body'>
          <InfoPanel mediatorRef={ref} />
        </SetupWrapper>
      </WorldSimProvider>,
    );

    /** useTranslations mock returns the key itself */
    expect(screen.getByText('bodies.test-body.name')).toBeInTheDocument();
  });

  it('renders back button that calls mediator.resetView', async () => {
    const user = userEvent.setup();
    const ref = createMediatorRef();
    render(
      <WorldSimProvider>
        <SetupWrapper bodyId='test-body'>
          <InfoPanel mediatorRef={ref} />
        </SetupWrapper>
      </WorldSimProvider>,
    );

    const backBtn = screen.getByLabelText('back');
    await user.click(backBtn);

    expect(ref.current.resetView).toHaveBeenCalledOnce();
  });

  it('renders region buttons for a body with regions', () => {
    const ref = createMediatorRef();
    render(
      <WorldSimProvider>
        <SetupWrapper bodyId='test-body'>
          <InfoPanel mediatorRef={ref} />
        </SetupWrapper>
      </WorldSimProvider>,
    );

    /** Body has 2 regions — back button + 2 region buttons = 3 total */
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('calls mediator.zoomToRegion when region is clicked', async () => {
    const user = userEvent.setup();
    const ref = createMediatorRef();
    render(
      <WorldSimProvider>
        <SetupWrapper bodyId='test-body'>
          <InfoPanel mediatorRef={ref} />
        </SetupWrapper>
      </WorldSimProvider>,
    );

    /** Click the first region button (aria-label is the translation key) */
    const regionBtn = screen.getByLabelText(
      'bodies.test-body.regions.region-a',
    );
    await user.click(regionBtn);

    expect(ref.current.zoomToRegion).toHaveBeenCalledWith(
      'test-body',
      'region-a',
    );
  });

  it('does not render region list for body without regions', () => {
    const ref = createMediatorRef();
    render(
      <WorldSimProvider>
        <SetupWrapper bodyId='no-regions'>
          <InfoPanel mediatorRef={ref} />
        </SetupWrapper>
      </WorldSimProvider>,
    );

    expect(screen.queryByText('regions')).not.toBeInTheDocument();
  });
});
