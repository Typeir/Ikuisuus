/**
 * @fileoverview BuilderSplitPane Unit Tests
 * @description Tests the viewport-aware two-pane wrapper: ResizablePane
 * pass-through on desktop, single-pane + summoned bottom sheet on phone
 * viewports, controlled sheet state, and the mobilePrimary inversion.
 *
 * @module tests/unit/modules/character-builder/presentation/builder/builderSplitPane
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react React Testing Library
 * @requires @/modules/character-builder/presentation/builder/builderSplitPane Component under test
 */

import { BuilderSplitPane } from '@/modules/character-builder/presentation/builder/builderSplitPane';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Sets window.innerWidth and dispatches a resize event.
 *
 * @param width - New innerWidth value
 */
function setViewportWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

const defaultProps = {
  id: 'test.split',
  sheetTitle: 'Preview',
  left: <div data-testid='left-pane'>left content</div>,
  right: <div data-testid='right-pane'>right content</div>,
};

describe('BuilderSplitPane', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('desktop viewport', () => {
    beforeEach(() => {
      setViewportWidth(1440);
    });

    it('renders both panes side by side', () => {
      render(<BuilderSplitPane {...defaultProps} />);
      expect(screen.getByTestId('left-pane')).toBeInTheDocument();
      expect(screen.getByTestId('right-pane')).toBeInTheDocument();
    });

    it('does not render a summon trigger', () => {
      render(
        <BuilderSplitPane {...defaultProps} mobileTriggerLabel='Summon' />,
      );
      expect(screen.queryByText('Summon')).not.toBeInTheDocument();
    });
  });

  describe('phone viewport', () => {
    beforeEach(() => {
      setViewportWidth(390);
    });

    it('renders only the left pane by default', () => {
      render(<BuilderSplitPane {...defaultProps} />);
      expect(screen.getByTestId('left-pane')).toBeInTheDocument();
      expect(screen.queryByTestId('right-pane')).not.toBeInTheDocument();
    });

    it('summons the right pane in a sheet via the trigger button', async () => {
      const user = userEvent.setup();
      render(
        <BuilderSplitPane {...defaultProps} mobileTriggerLabel='Summon' />,
      );

      await user.click(screen.getByText('Summon'));
      expect(screen.getByTestId('right-pane')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('opens the sheet when controlled via sheetOpen', () => {
      render(<BuilderSplitPane {...defaultProps} sheetOpen />);
      expect(screen.getByTestId('right-pane')).toBeInTheDocument();
    });

    it('calls onSheetClose when the controlled sheet is dismissed', async () => {
      const user = userEvent.setup();
      const onSheetClose = vi.fn();
      render(
        <BuilderSplitPane
          {...defaultProps}
          sheetOpen
          onSheetClose={onSheetClose}
        />,
      );

      await user.click(screen.getByLabelText('Close modal'));
      expect(onSheetClose).toHaveBeenCalledTimes(1);
    });

    it('keeps the right pane inline when mobilePrimary is right', () => {
      render(<BuilderSplitPane {...defaultProps} mobilePrimary='right' />);
      expect(screen.getByTestId('right-pane')).toBeInTheDocument();
      expect(screen.queryByTestId('left-pane')).not.toBeInTheDocument();
    });
  });
});
