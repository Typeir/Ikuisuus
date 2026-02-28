/**
 * @fileoverview WorldSim Root Component Unit Tests
 * @description Tests that the WorldSim wrapper renders the provider context
 * and composes inner components correctly.
 *
 * @module tests/unit/worldSim/WorldSim
 */

import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** Mock the inner hook so no Three.js subsystems are created */
vi.mock('@/lib/components/worldSim/hooks/useWorldSimCanvas', () => ({
  useWorldSimCanvas: () => ({
    containerRef: { current: null },
    mediatorRef: { current: null },
    subscribeToProjections: vi.fn(),
    bindElement: vi.fn(),
    unbindElement: vi.fn(),
  }),
}));

/** Mock overlay components to isolate WorldSim structural test */
vi.mock('@/lib/components/worldSim/overlay/ControlsBar', () => ({
  ControlsBar: () => <div data-testid='controls-bar' />,
}));

vi.mock('@/lib/components/worldSim/overlay/InfoPanel', () => ({
  InfoPanel: () => <div data-testid='info-panel' />,
}));

vi.mock('@/lib/components/worldSim/overlay/OverlayContainer', () => ({
  OverlayContainer: () => <div data-testid='overlay-container' />,
}));

vi.mock('@/lib/components/worldSim/overlay/ContentPanel', () => ({
  ContentPanel: () => <div data-testid='content-panel' />,
}));

import { WorldSim } from '@/lib/components/worldSim/WorldSim';

afterEach(() => {
  vi.clearAllMocks();
});

describe('WorldSim', () => {
  it('renders the canvas container', () => {
    const { container } = render(<WorldSim />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders loading overlay before initialization', () => {
    render(<WorldSim />);
    /** The loading text key (mocked useTranslations returns key) */
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('renders the header with title and subtitle', () => {
    render(<WorldSim />);
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('subtitle')).toBeInTheDocument();
  });

  it('composes all child components', () => {
    render(<WorldSim />);
    expect(screen.getByTestId('controls-bar')).toBeInTheDocument();
    expect(screen.getByTestId('info-panel')).toBeInTheDocument();
    expect(screen.getByTestId('overlay-container')).toBeInTheDocument();
    expect(screen.getByTestId('content-panel')).toBeInTheDocument();
  });
});
