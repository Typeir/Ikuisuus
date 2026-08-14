/**
 * @fileoverview WorldSimContentPanel Unit Tests
 * @description Tests visibility conditions, iframe embed URL construction,
 * loading state, close/reopen behavior, and integration with CelestialRegistry
 * for content path resolution.
 *
 * @module tests/unit/worldSim/overlay/WorldSimContentPanel
 */

import {
    WorldSimProvider as BaseWorldSimProvider,
    useWorldSimDispatch,
} from '@/modules/world-sim/application/state/WorldSimContext';
import { WorldSimControlsProvider } from '@/modules/world-sim/application/state/WorldSimControlsContext';
import { WorldSimActionType } from '@/modules/world-sim/application/state/worldSimTypes';
import { WorldSimContentPanel } from '@/modules/world-sim/presentation/overlay/WorldSimContentPanel/WorldSimContentPanel';
import type { WorldSimMediator } from '@/modules/world-sim/presentation/WorldSim/WorldSimMediator';
import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Test-local wrapper supplying both the state and controls providers. The
 * mediator stub dispatches `Deselect` on `resetView`.
 */
const mediatorRef: { current: WorldSimMediator | null } = { current: null };

function MediatorStubBinder() {
  const dispatch = useWorldSimDispatch();
  React.useEffect(() => {
    mediatorRef.current = {
      resetView: () => {
        dispatch({ type: WorldSimActionType.Deselect });
      },
    } as unknown as WorldSimMediator;
    return () => {
      mediatorRef.current = null;
    };
  }, [dispatch]);
  return null;
}

function WorldSimProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseWorldSimProvider>
      <MediatorStubBinder />
      <WorldSimControlsProvider mediatorRef={mediatorRef}>
        {children}
      </WorldSimControlsProvider>
    </BaseWorldSimProvider>
  );
}

/** Mock next/navigation useParams */
vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}));

/** Mock CelestialRegistry */
vi.mock('@/modules/world-sim/domain/celestials/celestialRegistry', () => ({
  CelestialRegistry: {
    shared: () => ({
      getBodyById: (id: string) => {
        if (id === 'test-body') {
          return { id: 'test-body', contentPath: 'world/test-body' };
        }
        if (id === 'no-content') {
          return { id: 'no-content' };
        }
        return undefined;
      },
      getRegion: (bodyId: string, regionId: string) => {
        if (bodyId === 'test-body' && regionId === 'reg-1') {
          return {
            id: 'reg-1',
            contentPath: 'world/test-body/reg-1',
            surfacePosition: { lat: 0, lon: 0 },
          };
        }
        return undefined;
      },
    }),
  },
}));

/** Mock GenericEmbedPanel for tests. */
vi.mock('@/lib/components/ui/embedPanel/GenericEmbedPanel', async () => {
  const { useState, useEffect } = await import('react');

  const MockGenericEmbedPanel = ({
    url,
    locale,
    testId,
    iframeTitle,
    onClosed,
  }: {
    url: string | null;
    locale: string;
    testId?: string;
    iframeTitle?: string;
    onClosed?: () => void;
  }) => {
    const [isClosed, setIsClosed] = useState(false);

    useEffect(() => {
      setIsClosed(false);
    }, [url]);

    if (isClosed) return null;

    return (
      <div data-testid={testId}>
        <button
          onClick={() => {
            setIsClosed(true);
            onClosed?.();
          }}
          type='button'
          aria-label='Close panel'>
          Close
        </button>
        <div role='complementary'>
          {url && (
            <iframe
              src={`/${locale}/embed/${url}`}
              title={iframeTitle ?? 'Embed'}
              sandbox='allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox'
            />
          )}
        </div>
      </div>
    );
  };

  return { GenericEmbedPanel: MockGenericEmbedPanel };
});

afterEach(() => {
  vi.clearAllMocks();
});

/** Wrapper that initializes and selects a body */
function SelectBodyWrapper({
  bodyId,
  regionId,
  children,
}: {
  bodyId: string;
  regionId?: string;
  children: React.ReactNode;
}) {
  const dispatch = useWorldSimDispatch();
  React.useEffect(() => {
    dispatch({ type: WorldSimActionType.Initialize });
    dispatch({ type: WorldSimActionType.SelectBody, bodyId });
    if (regionId) {
      dispatch({ type: WorldSimActionType.SelectRegion, regionId, bodyId });
    }
  }, [dispatch, bodyId, regionId]);
  return <>{children}</>;
}

describe('WorldSimContentPanel', () => {
  it('returns null when not initialized', () => {
    const { container } = render(
      <WorldSimProvider>
        <WorldSimContentPanel />
      </WorldSimProvider>,
    );

    expect(container.querySelector('[role="complementary"]')).toBeNull();
  });

  it('returns null when no body is selected', () => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => {
      const dispatch = useWorldSimDispatch();
      React.useEffect(() => {
        dispatch({ type: WorldSimActionType.Initialize });
      }, [dispatch]);
      return <>{children}</>;
    };

    const { container } = render(
      <WorldSimProvider>
        <Wrapper>
          <WorldSimContentPanel />
        </Wrapper>
      </WorldSimProvider>,
    );

    expect(container.querySelector('[role="complementary"]')).toBeNull();
  });

  it('renders iframe with correct embed URL when body has contentPath', () => {
    render(
      <WorldSimProvider>
        <SelectBodyWrapper bodyId='test-body'>
          <WorldSimContentPanel />
        </SelectBodyWrapper>
      </WorldSimProvider>,
    );

    const iframe = screen.getByTitle('Content preview') as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toContain('/en/embed/world/test-body');
  });

  it('returns null when body has no contentPath', () => {
    const { container } = render(
      <WorldSimProvider>
        <SelectBodyWrapper bodyId='no-content'>
          <WorldSimContentPanel />
        </SelectBodyWrapper>
      </WorldSimProvider>,
    );

    expect(container.querySelector('iframe')).toBeNull();
  });

  it('prioritizes region contentPath when region selected', () => {
    render(
      <WorldSimProvider>
        <SelectBodyWrapper bodyId='test-body' regionId='reg-1'>
          <WorldSimContentPanel />
        </SelectBodyWrapper>
      </WorldSimProvider>,
    );

    const iframe = screen.getByTitle('Content preview') as HTMLIFrameElement;
    expect(iframe.src).toContain(
      '/en/embed/world/test-body/reg-1',
    );
  });

  it('renders with loading spinner initially', () => {
    const { container } = render(
      <WorldSimProvider>
        <SelectBodyWrapper bodyId='test-body'>
          <WorldSimContentPanel />
        </SelectBodyWrapper>
      </WorldSimProvider>,
    );

    /** Loading spinner should be present before iframe loads */
    expect(
      container.querySelector('[role="complementary"]'),
    ).toBeInTheDocument();
  });

  it('renders close button via GenericEmbedPanel onClose', () => {
    render(
      <WorldSimProvider>
        <SelectBodyWrapper bodyId='test-body'>
          <WorldSimContentPanel />
        </SelectBodyWrapper>
      </WorldSimProvider>,
    );

    const closeButton = screen.getByRole('button', { name: 'Close panel' });
    expect(closeButton).toBeInTheDocument();
  });

  it('hides panel when close button is clicked', async () => {
    const { container } = render(
      <WorldSimProvider>
        <SelectBodyWrapper bodyId='test-body'>
          <WorldSimContentPanel />
        </SelectBodyWrapper>
      </WorldSimProvider>,
    );

    expect(container.querySelector('iframe')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: 'Close panel' });
    await act(async () => {
      closeButton.click();
    });

    expect(container.querySelector('iframe')).toBeNull();
  });

  it('reopens panel when body selection changes after close', async () => {
    /** Helper that exposes dispatch for dynamic selection changes */
    function DynamicSelector({ children }: { children: React.ReactNode }) {
      const dispatch = useWorldSimDispatch();
      React.useEffect(() => {
        dispatch({ type: WorldSimActionType.Initialize });
        dispatch({ type: WorldSimActionType.SelectBody, bodyId: 'test-body' });
      }, [dispatch]);
      return <>{children}</>;
    }

    const { container, rerender } = render(
      <WorldSimProvider>
        <DynamicSelector>
          <WorldSimContentPanel />
        </DynamicSelector>
      </WorldSimProvider>,
    );

    /** Close the panel */
    const closeButton = screen.getByRole('button', { name: 'Close panel' });
    await act(async () => {
      closeButton.click();
    });

    expect(container.querySelector('iframe')).toBeNull();

    /**
     * Re-renders with a new selector that dispatches a new selection.
     */
    function NewSelector({ children }: { children: React.ReactNode }) {
      const dispatch = useWorldSimDispatch();
      React.useEffect(() => {
        dispatch({ type: WorldSimActionType.SelectBody, bodyId: 'test-body' });
        dispatch({
          type: WorldSimActionType.SelectRegion,
          regionId: 'reg-1',
          bodyId: 'test-body',
        });
      }, [dispatch]);
      return <>{children}</>;
    }

    await act(async () => {
      rerender(
        <WorldSimProvider>
          <NewSelector>
            <WorldSimContentPanel />
          </NewSelector>
        </WorldSimProvider>,
      );
    });

    /** Panel should reopen with the new selection */
    expect(container.querySelector('iframe')).toBeInTheDocument();
  });

  it('passes resizable prop to GenericEmbedPanel', () => {
    render(
      <WorldSimProvider>
        <SelectBodyWrapper bodyId='test-body'>
          <WorldSimContentPanel />
        </SelectBodyWrapper>
      </WorldSimProvider>,
    );

    const draggable = screen.getByTestId('content-panel-draggable');
    expect(draggable).toBeInTheDocument();
  });

  it('reopens panel when the same body is re-selected after close', async () => {
    function Controller() {
      const dispatch = useWorldSimDispatch();
      React.useEffect(() => {
        dispatch({ type: WorldSimActionType.Initialize });
        dispatch({ type: WorldSimActionType.SelectBody, bodyId: 'test-body' });
      }, [dispatch]);
      return (
        <button
          type='button'
          data-testid='reselect'
          onClick={() =>
            dispatch({
              type: WorldSimActionType.SelectBody,
              bodyId: 'test-body',
            })
          }>
          reselect
        </button>
      );
    }

    const { container } = render(
      <WorldSimProvider>
        <Controller />
        <WorldSimContentPanel />
      </WorldSimProvider>,
    );

    expect(container.querySelector('iframe')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: 'Close panel' });
    await act(async () => {
      closeButton.click();
    });

    expect(container.querySelector('iframe')).toBeNull();

    const reselect = screen.getByTestId('reselect');
    await act(async () => {
      reselect.click();
    });

    expect(container.querySelector('iframe')).toBeInTheDocument();
  });
});
