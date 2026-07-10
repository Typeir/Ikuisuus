/**
 * @fileoverview DiceRoll Component Unit Tests
 * @description Tests for the interactive DiceRoll MDX component.
 * Covers rendering, click-to-roll behavior, special modifiers, and edge cases.
 *
 * @module tests/unit/modules/library/presentation/components/DiceRoll/DiceRoll
 * @version 1.0.0
 * @author Typeir
 * @since 2026-07-10
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Component testing utilities
 */

import DiceRoll from '@/modules/library/presentation/components/DiceRoll/DiceRoll';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Creates a user event instance for async interaction testing.
 *
 * @returns {ReturnType<typeof userEvent.setup>} Configured user event instance
 */
function setupUser() {
  return userEvent.setup();
}

describe('DiceRoll', () => {
  describe('rendering', () => {
    it('should render the dice expression as a button', () => {
      render(<DiceRoll dice='2d20' />);
      const button = screen.getByRole('button', { name: /roll 2d20/i });
      expect(button).toBeDefined();
      expect(button.textContent).toBe('2d20');
    });

    it('should render dice with modifier', () => {
      render(<DiceRoll dice='2d20' modifier='+5' />);
      const button = screen.getByRole('button');
      expect(button.textContent).toContain('+5');
    });

    it('should render dice with damage type', () => {
      render(<DiceRoll dice='3d6' damageType='fire' />);
      const button = screen.getByRole('button');
      expect(button.textContent).toContain('fire');
    });

    it('should render dice with specials', () => {
      render(<DiceRoll dice='2d20' specials='KH1' />);
      const button = screen.getByRole('button');
      expect(button.textContent).toContain(';KH1');
    });

    it('should render full expression with all props', () => {
      render(
        <DiceRoll
          dice='2d20'
          specials='KH1'
          modifier='+5'
          damageType='radiant'
        />,
      );
      const button = screen.getByRole('button');
      expect(button.textContent).toBe('2d20;KH1 +5 radiant');
    });

    it('should have accessible aria-label', () => {
      render(<DiceRoll dice='2d20' modifier='+5' damageType='fire' />);
      const button = screen.getByRole('button', {
        name: /roll 2d20 \+5 fire/i,
      });
      expect(button).toBeDefined();
    });
  });

  describe('roll interaction', () => {
    beforeEach(() => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    it('should display result on click', async () => {
      const user = setupUser();
      render(<DiceRoll dice='1d20' />);
      const button = screen.getByRole('button');
      await user.click(button);
      const results = screen.getAllByText('11');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should show dice breakdown in result', async () => {
      const user = setupUser();
      render(<DiceRoll dice='2d6' />);
      const button = screen.getByRole('button');
      await user.click(button);
      const allEights = screen.getAllByText('4');
      expect(allEights.length).toBeGreaterThan(0);
    });

    it('should include modifier in total', async () => {
      const user = setupUser();
      render(<DiceRoll dice='1d20' modifier='+5' />);
      const button = screen.getByRole('button');
      await user.click(button);
      const results = screen.getAllByText('16');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('KH1 special', () => {
    it('should keep only the highest die', async () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.9);
      const user = setupUser();
      render(<DiceRoll dice='2d20' specials='KH1' />);
      const button = screen.getByRole('button');
      await user.click(button);
      const results = screen.getAllByText('19');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('KL1 special', () => {
    it('should keep only the lowest die', async () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.9);
      const user = setupUser();
      render(<DiceRoll dice='2d20' specials='KL1' />);
      const button = screen.getByRole('button');
      await user.click(button);
      const results = screen.getAllByText('3');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('DL1 special', () => {
    it('should drop the lowest die and sum remaining', async () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.9);
      const user = setupUser();
      render(<DiceRoll dice='3d6' specials='DL1' />);
      const button = screen.getByRole('button');
      await user.click(button);
      const results = screen.getAllByText('10');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('DH1 special', () => {
    it('should drop the highest die and sum remaining', async () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.9);
      const user = setupUser();
      render(<DiceRoll dice='3d6' specials='DH1' />);
      const button = screen.getByRole('button');
      await user.click(button);
      const results = screen.getAllByText('5');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle single die with KH1 (no change)', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const user = setupUser();
      render(<DiceRoll dice='1d20' specials='KH1' />);
      const button = screen.getByRole('button');
      await user.click(button);
      const results = screen.getAllByText('11');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle empty specials string', () => {
      render(<DiceRoll dice='2d20' specials='' />);
      const button = screen.getByRole('button');
      expect(button.textContent).not.toContain(';');
    });

    it('should be a button element', () => {
      render(<DiceRoll dice='2d20' />);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });
  });
});
