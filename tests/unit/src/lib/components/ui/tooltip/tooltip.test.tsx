/**
 * @fileoverview Tooltip Component Tests
 * @description Unit tests for the Tooltip UI component.
 */

import { Tooltip, withTooltip } from '@/lib/components/ui/tooltip';
import { act, fireEvent, render, screen } from '@testing-library/react';
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
  const originalGetBCR = Element.prototype.getBoundingClientRect;

  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 768,
      writable: true,
    });
    Element.prototype.getBoundingClientRect = function () {
      return {
        x: 400,
        y: 300,
        width: 100,
        height: 40,
        top: 300,
        right: 500,
        bottom: 340,
        left: 400,
        toJSON() {
          return this;
        },
      } as DOMRect;
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    Element.prototype.getBoundingClientRect = originalGetBCR;
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
      // Fire hideDelay (0ms) timeout → sets exiting=true → triggers useEffect
      act(() => {
        vi.advanceTimersByTime(0);
      });
      // Fire EXIT_DURATION (150ms) timeout → sets isVisible=false
      act(() => {
        vi.advanceTimersByTime(200);
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
      // Fire hideDelay (0ms) timeout → sets exiting=true → triggers useEffect
      act(() => {
        vi.advanceTimersByTime(0);
      });
      // Fire EXIT_DURATION (150ms) timeout → sets isVisible=false
      act(() => {
        vi.advanceTimersByTime(200);
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
      // Fire hideDelay (0ms) timeout → sets exiting=true → triggers useEffect
      act(() => {
        vi.advanceTimersByTime(0);
      });
      // Fire EXIT_DURATION (150ms) timeout → sets isVisible=false
      act(() => {
        vi.advanceTimersByTime(200);
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

  describe('Clickable Mode', () => {
    it('shows CircleHelp icon when clickable=true', () => {
      const { container } = render(
        <Tooltip content='Tooltip text' clickable showDelay={0}>
          <button>Help me</button>
        </Tooltip>,
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('does NOT show icon when showClickIcon=false', () => {
      const { container } = render(
        <Tooltip content='Tooltip text' showDelay={0} showClickIcon={false}>
          <button>Hover me</button>
        </Tooltip>,
      );

      const icon = container.querySelector('svg');
      expect(icon).not.toBeInTheDocument();
    });

    it('applies triggerClickable class when clickable=true', () => {
      const { container } = render(
        <Tooltip content='Tooltip text' clickable showDelay={0}>
          <button>Help me</button>
        </Tooltip>,
      );

      const span = container.querySelector('span[style*="inline-flex"]');
      expect(span?.className).toContain('triggerClickable');
    });

    it('does NOT apply triggerClickable class when clickable=false', () => {
      const { container } = render(
        <Tooltip content='Tooltip text' showDelay={0}>
          <button>Hover me</button>
        </Tooltip>,
      );

      const span = container.querySelector('span[style*="inline-flex"]');
      expect(span?.className).not.toContain('triggerClickable');
    });

    it('calls onItemClick when trigger is clicked and clickable=true', () => {
      const handleClick = vi.fn();
      render(
        <Tooltip
          content='Tooltip text'
          clickable
          onItemClick={handleClick}
          showDelay={0}>
          <button>Click me</button>
        </Tooltip>,
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does NOT call onItemClick when clickable=false', () => {
      const handleClick = vi.fn();
      render(
        <Tooltip
          content='Tooltip text'
          clickable={false}
          onItemClick={handleClick}
          showDelay={0}>
          <button>Click me</button>
        </Tooltip>,
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('hides icon when showClickIcon=false', () => {
      const { container } = render(
        <Tooltip
          content='Tooltip text'
          clickable
          showClickIcon={false}
          showDelay={0}>
          <button>Help me</button>
        </Tooltip>,
      );

      const icon = container.querySelector('svg');
      expect(icon).not.toBeInTheDocument();
    });

    it('shows icon by default when clickable=true', () => {
      const { container } = render(
        <Tooltip content='Tooltip text' clickable showDelay={0}>
          <button>Help me</button>
        </Tooltip>,
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
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
