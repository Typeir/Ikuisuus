/**
 * @fileoverview WorldSimContext Unit Tests
 * @description Tests the WorldSimProvider, useWorldSimState, and
 * useWorldSimDispatch hooks including dispatch behavior and
 * context isolation.
 *
 * @module tests/unit/src/modules/world-sim/application/state/WorldSimContext.test
 */

import {
    WorldSimProvider,
    useWorldSimDispatch,
    useWorldSimState,
} from '@/modules/world-sim/application/state/WorldSimContext';
import {
    WorldSimActionType
} from '@/modules/world-sim/application/state/worldSimTypes';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.clearAllMocks();
});

/**
 * Test component that reads state and renders key values.
 */
function StateReader() {
  const state = useWorldSimState();
  return (
    <div>
      <span data-testid='zoom'>{state.zoomLevel}</span>
      <span data-testid='body'>{state.selectedBodyId ?? 'none'}</span>
      <span data-testid='labels'>{String(state.labelsVisible)}</span>
      <span data-testid='initialized'>{String(state.isInitialized)}</span>
    </div>
  );
}

/**
 * Test component that dispatches actions via buttons.
 */
function DispatchTrigger() {
  const dispatch = useWorldSimDispatch();
  return (
    <div>
      <button onClick={() => dispatch({ type: WorldSimActionType.Initialize })}>
        Init
      </button>
      <button
        onClick={() =>
          dispatch({ type: WorldSimActionType.SelectBody, bodyId: 'test-body' })
        }>
        Select
      </button>
      <button
        onClick={() => dispatch({ type: WorldSimActionType.ToggleLabels })}>
        Toggle
      </button>
    </div>
  );
}

describe('WorldSimContext', () => {
  it('provides initial state to children', () => {
    render(
      <WorldSimProvider>
        <StateReader />
      </WorldSimProvider>,
    );

    expect(screen.getByTestId('zoom')).toHaveTextContent('system');
    expect(screen.getByTestId('body')).toHaveTextContent('none');
    expect(screen.getByTestId('labels')).toHaveTextContent('true');
    expect(screen.getByTestId('initialized')).toHaveTextContent('false');
  });

  it('dispatches Initialize action', async () => {
    const user = userEvent.setup();

    render(
      <WorldSimProvider>
        <StateReader />
        <DispatchTrigger />
      </WorldSimProvider>,
    );

    await user.click(screen.getByText('Init'));

    expect(screen.getByTestId('initialized')).toHaveTextContent('true');
  });

  it('dispatches SelectBody action', async () => {
    const user = userEvent.setup();

    render(
      <WorldSimProvider>
        <StateReader />
        <DispatchTrigger />
      </WorldSimProvider>,
    );

    await user.click(screen.getByText('Select'));

    expect(screen.getByTestId('body')).toHaveTextContent('test-body');
    expect(screen.getByTestId('zoom')).toHaveTextContent('body');
  });

  it('dispatches ToggleLabels action', async () => {
    const user = userEvent.setup();

    render(
      <WorldSimProvider>
        <StateReader />
        <DispatchTrigger />
      </WorldSimProvider>,
    );

    expect(screen.getByTestId('labels')).toHaveTextContent('true');

    await user.click(screen.getByText('Toggle'));

    expect(screen.getByTestId('labels')).toHaveTextContent('false');
  });
});
