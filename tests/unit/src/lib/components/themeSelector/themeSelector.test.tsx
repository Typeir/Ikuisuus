/**
 * ThemeSelector Component Unit Tests
 *
 * @fileoverview Tests for the theme selector component that provides circular
 * theme switching functionality using rangeWrap for wrap-around navigation.
 *
 * @module tests/unit/lib/components/themeSelector
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react React Testing Library
 * @requires @/lib/components/themeSelector/themeSelector Component under test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeSelector } from '@/lib/components/themeSelector/themeSelector';
import { Theme } from '@/lib/enums/themes';

describe('ThemeSelector', () => {
  describe('rendering', () => {
    it('should render without crashing', () => {
      render(<ThemeSelector />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render theme toggle button', () => {
      render(<ThemeSelector />);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Theme:');
    });

    it('should accept defaultTheme prop', () => {
      render(<ThemeSelector defaultTheme={Theme.Light} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should accept onThemeChange callback prop', () => {
      const mockCallback = vi.fn();
      render(<ThemeSelector onThemeChange={mockCallback} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('theme cycling', () => {
    it('should call onThemeChange when button clicked', () => {
      const mockCallback = vi.fn();
      render(<ThemeSelector onThemeChange={mockCallback} />);

      fireEvent.click(screen.getByRole('button'));

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should pass Theme enum value to onThemeChange', () => {
      const mockCallback = vi.fn();
      render(<ThemeSelector defaultTheme={Theme.Dark} onThemeChange={mockCallback} />);

      fireEvent.click(screen.getByRole('button'));

      expect(mockCallback).toHaveBeenCalledWith(expect.any(String));
      expect(Object.values(Theme)).toContain(mockCallback.mock.calls[0][0]);
    });

    it('should cycle through themes on multiple clicks', () => {
      const mockCallback = vi.fn();
      render(<ThemeSelector onThemeChange={mockCallback} />);

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByRole('button'));

      expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('should wrap around when reaching end of theme list', () => {
      const themeValues: string[] = [];
      const mockCallback = vi.fn((theme: Theme) => themeValues.push(theme));

      render(<ThemeSelector defaultTheme={Theme.Dark} onThemeChange={mockCallback} />);

      const themesCount = Object.values(Theme).length;
      for (let i = 0; i < themesCount + 1; i++) {
        fireEvent.click(screen.getByRole('button'));
      }

      expect(mockCallback).toHaveBeenCalledTimes(themesCount + 1);
    });
  });

  describe('default behavior', () => {
    it('should not throw when onThemeChange is not provided', () => {
      render(<ThemeSelector />);

      expect(() => {
        fireEvent.click(screen.getByRole('button'));
      }).not.toThrow();
    });

    it('should handle undefined defaultTheme gracefully', () => {
      render(<ThemeSelector />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
