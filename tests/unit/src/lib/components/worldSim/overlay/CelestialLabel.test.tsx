/**
 * @fileoverview CelestialLabel Unit Tests
 * @description Tests rendering, click handling, keyboard interaction,
 * CSS class toggling, and ref forwarding for the floating label component.
 *
 * @module tests/unit/worldSim/overlay/CelestialLabel
 */

import { CelestialLabel } from '@/lib/components/worldSim/overlay/CelestialLabel';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.clearAllMocks();
});

/** Default props for test rendering */
const defaultProps = {
  bodyId: 'damocles',
  name: 'Damocles',
  subtitle: 'Gas Giant',
  isHovered: false,
  isSelected: false,
  onClick: vi.fn(),
};

describe('CelestialLabel', () => {
  it('renders name and subtitle', () => {
    render(<CelestialLabel {...defaultProps} />);

    expect(screen.getByText('Damocles')).toBeInTheDocument();
    expect(screen.getByText('Gas Giant')).toBeInTheDocument();
  });

  it('passes bodyId to onClick callback', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CelestialLabel {...defaultProps} onClick={onClick} />);

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledWith('damocles');
  });

  it('fires onClick on Enter key', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CelestialLabel {...defaultProps} onClick={onClick} />);

    const button = screen.getByRole('button');
    button.focus();
    await user.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledWith('damocles');
  });

  it('fires onClick on Space key', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CelestialLabel {...defaultProps} onClick={onClick} />);

    const button = screen.getByRole('button');
    button.focus();
    await user.keyboard(' ');

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire onClick on other keys', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CelestialLabel {...defaultProps} onClick={onClick} />);

    const button = screen.getByRole('button');
    button.focus();
    await user.keyboard('{Tab}');

    expect(onClick).not.toHaveBeenCalled();
  });

  it('sets aria-label with name and subtitle', () => {
    render(<CelestialLabel {...defaultProps} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Damocles - Gas Giant');
  });

  it('forwards ref to the button element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<CelestialLabel {...defaultProps} ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('applies hovered class when isHovered is true', () => {
    const { container } = render(
      <CelestialLabel {...defaultProps} isHovered={true} />,
    );

    const button = container.querySelector('button');
    expect(button?.className).toMatch(/hovered/);
  });

  it('applies selected class when isSelected is true', () => {
    const { container } = render(
      <CelestialLabel {...defaultProps} isSelected={true} />,
    );

    const button = container.querySelector('button');
    expect(button?.className).toMatch(/selected/);
  });

  it('does not apply hovered/selected classes when both are false', () => {
    const { container } = render(<CelestialLabel {...defaultProps} />);

    const button = container.querySelector('button');
    expect(button?.className).not.toMatch(/hovered/);
    expect(button?.className).not.toMatch(/selected/);
  });
});
