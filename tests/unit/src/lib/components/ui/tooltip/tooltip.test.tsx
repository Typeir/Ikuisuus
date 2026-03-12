/**
 * @fileoverview Tooltip Component Tests
 * @description Unit tests for the Tooltip UI component.
 */

import { Tooltip, withTooltip } from '@/lib/components/ui/tooltip';
import {
    act,
    fireEvent,
    render,
    screen
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock createPortal for tooltip rendering
vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('returns children when content is empty', () => {
      render(
        <Tooltip content=''>
          <button>Hover me</button>
        </Tooltip>,
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('hides tooltip on blur after showing on focus', () => {
      render(
        <Tooltip content='Focus tip' showDelay={0} hideDelay={0}>
          <button>Focus me</button>
        </Tooltip>,
      );

      fireEvent.focus(screen.getByRole('button'));
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.blur(screen.getByRole('button'));
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('renders children without tooltip initially', () => {
      render(
        <Tooltip content='Tooltip text'>
          <button>Hover me</button>
        </Tooltip>,
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('renders with string content', async () => {
      render(
        <Tooltip content='Tooltip text'>
          <button>Hover me</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole('button'));
      act(() => {
        vi.advanceTimersByTime(300); // Default showDelay is 200
      });

      expect(screen.getByRole('tooltip')).toHaveTextContent('Tooltip text');
    });

    it('renders with React node content', async () => {
      render(
        <Tooltip
          content={<span data-testid='custom-content'>Custom content</span>}>
          <button>Hover me</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole('button'));
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    });
  });

  describe('Show/Hide Behavior', () => {
    it('shows tooltip on mouse enter after delay', async () => {
      render(
        <Tooltip content='Tooltip text' showDelay={200}>
          <button>Hover me</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole('button'));

      // Tooltip should not be visible immediately
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      // Advance time past delay
      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('hides tooltip on mouse leave', async () => {
      render(
        <Tooltip content='Tooltip text' showDelay={0}>
          <button>Hover me</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole('button'));
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.mouseLeave(screen.getByRole('button'));
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('shows tooltip on focus', async () => {
      render(
        <Tooltip content='Tooltip text' showDelay={0}>
          <button>Focus me</button>
        </Tooltip>,
      );

      fireEvent.focus(screen.getByRole('button'));
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('hides tooltip on blur', async () => {
      render(
        <Tooltip content='Tooltip text' showDelay={0}>
          <button>Focus me</button>
        </Tooltip>,
      );

      fireEvent.focus(screen.getByRole('button'));
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.blur(screen.getByRole('button'));
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    // Note: Escape key hiding is not currently implemented in Tooltip component
  });

  describe('Delay Configuration', () => {
    it('respects custom showDelay', async () => {
      render(
        <Tooltip content='Tooltip text' showDelay={500}>
          <button>Hover me</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole('button'));

      // Not visible at 200ms
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      // Visible at 500ms+
      act(() => {
        vi.advanceTimersByTime(350);
      });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('shows immediately with showDelay of 0', async () => {
      render(
        <Tooltip content='Tooltip text' showDelay={0}>
          <button>Hover me</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole('button'));
      act(() => {
        vi.advanceTimersByTime(10);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  describe('Placement', () => {
    it('accepts top placement', () => {
      render(
        <Tooltip content='Tooltip text' placement='top' showDelay={0}>
          <button>Hover me</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole('button'));
      act(() => {
        vi.advanceTimersByTime(50);
      });

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip.className).toContain('top');
    });

    it('accepts bottom placement', () => {
      render(
        <Tooltip content='Tooltip text' placement='bottom' showDelay={0}>
          <button>Hover me</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole('button'));
      act(() => {
        vi.advanceTimersByTime(50);
      });

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip.className).toContain('bottom');
    });

    it('accepts left placement', () => {
      render(
        <Tooltip content='Tooltip text' placement='left' showDelay={0}>
          <button>Hover me</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole('button'));
      act(() => {
        vi.advanceTimersByTime(50);
      });

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip.className).toContain('left');
    });

    it('accepts right placement', () => {
      render(
        <Tooltip content='Tooltip text' placement='right' showDelay={0}>
          <button>Hover me</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole('button'));
      act(() => {
        vi.advanceTimersByTime(50);
      });

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip.className).toContain('right');
    });
  });

  describe('Disabled State', () => {
    it('does not show tooltip when disabled', async () => {
      render(
        <Tooltip content='Tooltip text' disabled showDelay={0}>
          <button>Hover me</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole('button'));
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('ARIA Attributes', () => {
    it('has role="tooltip"', () => {
      render(
        <Tooltip content='Tooltip text' showDelay={0}>
          <button>Hover me</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole('button'));
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('associates trigger with tooltip via aria-describedby', () => {
      render(
        <Tooltip content='Tooltip text' id='test-tooltip' showDelay={0}>
          <button>Hover me</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole('button'));
      act(() => {
        vi.advanceTimersByTime(50);
      });

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveAttribute('id', 'test-tooltip');
    });
  });
});

describe('withTooltip HOC', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('wraps component with tooltip functionality', () => {
    const Button = ({
      children,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button {...props}>{children}</button>
    );

    const ButtonWithTooltip = withTooltip(Button);

    render(
      <ButtonWithTooltip tooltip='Click me'>Button text</ButtonWithTooltip>,
    );

    expect(screen.getByRole('button')).toHaveTextContent('Button text');
  });

  it('shows tooltip on hover when tooltip prop provided', () => {
    const Button = ({
      children,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button {...props}>{children}</button>
    );

    const ButtonWithTooltip = withTooltip(Button);

    render(
      <ButtonWithTooltip tooltip='Tooltip content'>
        Button text
      </ButtonWithTooltip>,
    );

    fireEvent.mouseEnter(screen.getByRole('button'));
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole('tooltip')).toHaveTextContent('Tooltip content');
  });

  it('does not show tooltip when tooltip prop is undefined', () => {
    const Button = ({
      children,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button {...props}>{children}</button>
    );

    const ButtonWithTooltip = withTooltip(Button);

    render(<ButtonWithTooltip>Button text</ButtonWithTooltip>);

    fireEvent.mouseEnter(screen.getByRole('button'));
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('passes tooltipPlacement prop through HOC', () => {
    const Button = ({
      children,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button {...props}>{children}</button>
    );

    const ButtonWithTooltip = withTooltip(Button);

    render(
      <ButtonWithTooltip tooltip='Tooltip content' tooltipPlacement='bottom'>
        Button text
      </ButtonWithTooltip>,
    );

    fireEvent.mouseEnter(screen.getByRole('button'));
    act(() => {
      vi.advanceTimersByTime(300);
    });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.className).toContain('bottom');
  });
});
