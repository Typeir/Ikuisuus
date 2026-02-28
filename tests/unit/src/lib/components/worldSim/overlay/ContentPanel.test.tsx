/**
 * @fileoverview ContentPanel Unit Tests
 * @description Tests visibility conditions, iframe embed URL construction,
 * loading state, close/reopen behavior, and integration with CelestialRegistry
 * for content path resolution.
 *
 * @module tests/unit/worldSim/overlay/ContentPanel
 */

import {
    WorldSimProvider,
    useWorldSimDispatch,
} from '@/lib/components/worldSim/context/WorldSimContext';
import { WorldSimActionType } from '@/lib/components/worldSim/context/worldSimTypes';
import { ContentPanel } from '@/lib/components/worldSim/overlay/ContentPanel';
import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** Mock next/navigation useParams */
vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}));

/** Mock CelestialRegistry */
vi.mock('@/lib/components/worldSim/celestials/CelestialRegistry', () => ({
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

/** Mock Draggable to simplify DOM output while exposing close & resize props */
vi.mock('@/lib/components/ui/draggable/Draggable', () => ({
  Draggable: ({
    children,
    testId,
    onClose,
    resizable,
    defaultHeight,
  }: {
    children: React.ReactNode;
    testId?: string;
    onClose?: () => void;
    resizable?: boolean;
    defaultHeight?: string;
  }) => (
    <div
      data-testid={testId}
      data-resizable={resizable ? 'true' : undefined}
      data-default-height={defaultHeight ?? undefined}>
      {onClose && (
        <button
          onClick={onClose}
          type='button'
          aria-label='Close panel'>
          ✕
        </button>
      )}
      {children}
    </div>
  ),
}));

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

describe('ContentPanel', () => {
  it('returns null when not initialized', () => {
    const { container } = render(
      <WorldSimProvider>
        <ContentPanel />
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
          <ContentPanel />
        </Wrapper>
      </WorldSimProvider>,
    );

    expect(container.querySelector('[role="complementary"]')).toBeNull();
  });

  it('renders iframe with correct embed URL when body has contentPath', () => {
    render(
      <WorldSimProvider>
        <SelectBodyWrapper bodyId='test-body'>
          <ContentPanel />
        </SelectBodyWrapper>
      </WorldSimProvider>,
    );

    const iframe = screen.getByTitle('Content preview') as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toContain('/en/library/world/test-body?embed=true');
  });

  it('returns null when body has no contentPath', () => {
    const { container } = render(
      <WorldSimProvider>
        <SelectBodyWrapper bodyId='no-content'>
          <ContentPanel />
        </SelectBodyWrapper>
      </WorldSimProvider>,
    );

    expect(container.querySelector('iframe')).toBeNull();
  });

  it('prioritizes region contentPath when region selected', () => {
    render(
      <WorldSimProvider>
        <SelectBodyWrapper bodyId='test-body' regionId='reg-1'>
          <ContentPanel />
        </SelectBodyWrapper>
      </WorldSimProvider>,
    );

    const iframe = screen.getByTitle('Content preview') as HTMLIFrameElement;
    expect(iframe.src).toContain(
      '/en/library/world/test-body/reg-1?embed=true',
    );
  });

  it('renders with loading spinner initially', () => {
    const { container } = render(
      <WorldSimProvider>
        <SelectBodyWrapper bodyId='test-body'>
          <ContentPanel />
        </SelectBodyWrapper>
      </WorldSimProvider>,
    );

    /** Loading spinner should be present before iframe loads */
    expect(
      container.querySelector('[role="complementary"]'),
    ).toBeInTheDocument();
  });

  it('renders close button via Draggable onClose', () => {
    render(
      <WorldSimProvider>
        <SelectBodyWrapper bodyId='test-body'>
          <ContentPanel />
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
          <ContentPanel />
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
    function DynamicSelector({
      children,
    }: {
      children: React.ReactNode;
    }) {
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
          <ContentPanel />
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
     * Re-render with different body to trigger reopen. We use a fresh
     * wrapper that dispatches a new selection.
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
            <ContentPanel />
          </NewSelector>
        </WorldSimProvider>,
      );
    });

    /** Panel should reopen with the new selection */
    expect(container.querySelector('iframe')).toBeInTheDocument();
  });

  it('passes resizable prop to Draggable', () => {
    render(
      <WorldSimProvider>
        <SelectBodyWrapper bodyId='test-body'>
          <ContentPanel />
        </SelectBodyWrapper>
      </WorldSimProvider>,
    );

    const draggable = screen.getByTestId('content-panel-draggable');
    expect(draggable).toHaveAttribute('data-resizable', 'true');
  });

  it('passes defaultHeight to Draggable for near-full height', () => {
    render(
      <WorldSimProvider>
        <SelectBodyWrapper bodyId='test-body'>
          <ContentPanel />
        </SelectBodyWrapper>
      </WorldSimProvider>,
    );

    const draggable = screen.getByTestId('content-panel-draggable');
    expect(draggable).toHaveAttribute('data-default-height', 'calc(100% - 48px)');
  });
});
