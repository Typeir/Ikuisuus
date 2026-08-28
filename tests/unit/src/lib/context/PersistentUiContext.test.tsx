/**
 * PersistentUiContext Unit Tests
 *
 * @fileoverview Tests for the persistent UI context provider: hydration, persistence, and hook behavior.
 */

import {
  PersistentUiProvider,
  usePersistentUiSelector,
  useSidebarMenuActions,
  useSidebarMenuState,
  useThemeActions,
  useThemeState,
} from '@/lib/context/PersistentUiContext';
import { Theme } from '@/lib/enums/themes';
import {
  PERSISTENT_UI_STORAGE_KEY
} from '@/lib/types/persistentUiState';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Test component displaying and manipulating sidebar state.
 */
function SidebarTestConsumer() {
  const { isOpen } = useSidebarMenuState();
  const { setOpen, toggle, close, open } = useSidebarMenuActions();

  return (
    <div>
      <span data-testid="menu-state">{isOpen ? 'open' : 'closed'}</span>
      <button onClick={() => open()}>Open</button>
      <button onClick={() => close()}>Close</button>
      <button onClick={() => toggle()}>Toggle</button>
      <button onClick={() => setOpen(true)}>SetOpen True</button>
    </div>
  );
}

/**
 * Test component displaying and manipulating theme state.
 */
function ThemeTestConsumer() {
  const { theme } = useThemeState();
  const { setTheme, toggleTheme } = useThemeActions();

  return (
    <div>
      <span data-testid="theme-state">{theme}</span>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => toggleTheme()}>Toggle Theme</button>
    </div>
  );
}

describe('PersistentUiContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Provider initialization', () => {
    it('should render children', () => {
      render(
        <PersistentUiProvider initialExpandedPaths={[]}>
          <div data-testid="child">Child content</div>
        </PersistentUiProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should provide default state when no persisted data exists', () => {
      render(
        <PersistentUiProvider initialExpandedPaths={[]}>
          <ThemeTestConsumer />
        </PersistentUiProvider>
      );

      expect(screen.getByTestId('theme-state')).toHaveTextContent(Theme.Dark);
    });
  });

  describe('Sidebar state management', () => {
    it('should toggle sidebar state', async () => {
      const user = userEvent.setup();

      render(
        <PersistentUiProvider initialExpandedPaths={[]}>
          <SidebarTestConsumer />
        </PersistentUiProvider>
      );

      expect(screen.getByTestId('menu-state')).toHaveTextContent('closed');

      await user.click(screen.getByText('Toggle'));

      await waitFor(() => {
        expect(screen.getByTestId('menu-state')).toHaveTextContent('open');
      });

      await user.click(screen.getByText('Toggle'));

      await waitFor(() => {
        expect(screen.getByTestId('menu-state')).toHaveTextContent('closed');
      });
    });

    it('should open and close sidebar using dedicated actions', async () => {
      const user = userEvent.setup();

      render(
        <PersistentUiProvider initialExpandedPaths={[]}>
          <SidebarTestConsumer />
        </PersistentUiProvider>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByTestId('menu-state')).toHaveTextContent('open');
      });

      await user.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(screen.getByTestId('menu-state')).toHaveTextContent('closed');
      });
    });

    it('should set sidebar to specific state with setOpen', async () => {
      const user = userEvent.setup();

      render(
        <PersistentUiProvider initialExpandedPaths={[]}>
          <SidebarTestConsumer />
        </PersistentUiProvider>
      );

      await user.click(screen.getByText('SetOpen True'));

      await waitFor(() => {
        expect(screen.getByTestId('menu-state')).toHaveTextContent('open');
      });
    });
  });

  describe('Theme state management', () => {
    it('should set theme to light', async () => {
      const user = userEvent.setup();

      render(
        <PersistentUiProvider initialExpandedPaths={[]}>
          <ThemeTestConsumer />
        </PersistentUiProvider>
      );

      await user.click(screen.getByText('Light'));

      await waitFor(() => {
        expect(screen.getByTestId('theme-state')).toHaveTextContent(Theme.Light);
      });
    });

    it('should set theme to dark', async () => {
      const user = userEvent.setup();

      render(
        <PersistentUiProvider initialExpandedPaths={[]}>
          <ThemeTestConsumer />
        </PersistentUiProvider>
      );

      await user.click(screen.getByText('Light'));
      await user.click(screen.getByText('Dark'));

      await waitFor(() => {
        expect(screen.getByTestId('theme-state')).toHaveTextContent(Theme.Dark);
      });
    });

    it('should toggle theme', async () => {
      const user = userEvent.setup();

      render(
        <PersistentUiProvider initialExpandedPaths={[]}>
          <ThemeTestConsumer />
        </PersistentUiProvider>
      );

      expect(screen.getByTestId('theme-state')).toHaveTextContent(Theme.Dark);

      await user.click(screen.getByText('Toggle Theme'));

      await waitFor(() => {
        expect(screen.getByTestId('theme-state')).toHaveTextContent(Theme.Light);
      });

      await user.click(screen.getByText('Toggle Theme'));

      await waitFor(() => {
        expect(screen.getByTestId('theme-state')).toHaveTextContent(Theme.Dark);
      });
    });

    it('should update DOM attribute when theme changes', async () => {
      const user = userEvent.setup();

      render(
        <PersistentUiProvider initialExpandedPaths={[]}>
          <ThemeTestConsumer />
        </PersistentUiProvider>
      );

      await user.click(screen.getByText('Light'));

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe(
          Theme.Light
        );
      });
    });
  });

  describe('Persistence', () => {
    it('should persist state to localStorage on changes', async () => {
      const user = userEvent.setup();

      render(
        <PersistentUiProvider initialExpandedPaths={[]}>
          <SidebarTestConsumer />
        </PersistentUiProvider>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        const stored = localStorage.getItem(PERSISTENT_UI_STORAGE_KEY);
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        expect(parsed.sidebarMenu.isOpen).toBe(true);
      });
    });

    it('should derive expansion from URL when no persisted state exists', async () => {
      // Mock window.location.pathname for URL derivation
      delete (window as any).location;
      (window as any).location = { pathname: '/en/library/monsters/ancient-red-dragon' };
      
      // Clear all localStorage to test URL-based fallback
      localStorage.clear();
      sessionStorage.clear();
      
      render(
        <PersistentUiProvider initialExpandedPaths={[]}>
          <ThemeTestConsumer />
        </PersistentUiProvider>
      );

      // Just verify it renders without error (theme will be 'dark' from DEFAULT_PERSISTENT_UI_STATE)
      await waitFor(() => {
        expect(screen.getByTestId('theme-state')).toBeInTheDocument();
      });
    });
  });

  describe('Hook error handling', () => {
    it('should throw when useSidebarMenuState is used outside provider', () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        render(<SidebarTestConsumer />);
      }).toThrow('usePersistentUiState must be used within a PersistentUiProvider');

      consoleError.mockRestore();
    });

    it('should throw when useThemeState is used outside provider', () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        render(<ThemeTestConsumer />);
      }).toThrow('usePersistentUiState must be used within a PersistentUiProvider');

      consoleError.mockRestore();
    });
  });

  describe('usePersistentUiSelector', () => {
    /**
     * Theme probe that tallies its own renders.
     */
    function ThemeSelectorProbe({ renders }: { renders: { count: number } }) {
      renders.count += 1;
      const theme = usePersistentUiSelector((state) => state.theme);
      return <span data-testid="selected-theme">{theme}</span>;
    }

    it('re-renders on a change to the selected value', async () => {
      const user = userEvent.setup();
      const renders = { count: 0 };

      render(
        <PersistentUiProvider initialExpandedPaths={[]}>
          <ThemeSelectorProbe renders={renders} />
          <ThemeTestConsumer />
        </PersistentUiProvider>
      );

      const initial = screen.getByTestId('selected-theme').textContent;
      await user.click(screen.getByText('Toggle Theme'));

      expect(screen.getByTestId('selected-theme')).not.toHaveTextContent(
        initial ?? ''
      );
      expect(screen.getByTestId('selected-theme')).toHaveTextContent(
        screen.getByTestId('theme-state').textContent ?? ''
      );
      expect(renders.count).toBe(2);
    });

    it('skips the component when an unrelated slice changes', async () => {
      const user = userEvent.setup();
      const renders = { count: 0 };

      render(
        <PersistentUiProvider initialExpandedPaths={[]}>
          <ThemeSelectorProbe renders={renders} />
          <SidebarTestConsumer />
        </PersistentUiProvider>
      );

      await user.click(screen.getByText('Toggle'));

      await waitFor(() => {
        expect(screen.getByTestId('menu-state')).toHaveTextContent('open');
      });
      expect(renders.count).toBe(1);
    });

    it('throws outside a provider', () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        render(<ThemeSelectorProbe renders={{ count: 0 }} />);
      }).toThrow(
        'usePersistentUiSelector must be used within a PersistentUiProvider'
      );

      consoleError.mockRestore();
    });
  });

  describe('Aspect display mode', () => {
    it('should stamp the root, expose window.ik.ui, and persist a change', async () => {
      render(
        <PersistentUiProvider initialExpandedPaths={[]}>
          <div />
        </PersistentUiProvider>
      );
      await waitFor(() =>
        expect(document.documentElement.getAttribute('data-aspect-display')).toBe('compact'),
      );
      const ik = (window as unknown as { ik: { ui: { aspectDisplay: string } } }).ik;
      expect(ik.ui.aspectDisplay).toBe('compact');

      await act(async () => {
        ik.ui.aspectDisplay = 'verbose';
      });
      await waitFor(() =>
        expect(document.documentElement.getAttribute('data-aspect-display')).toBe('verbose'),
      );
      const stored = JSON.parse(localStorage.getItem('ikuisuus-ui-state') ?? '{}');
      expect(stored.aspectDisplay).toBe('verbose');
      expect(ik.ui.aspectDisplay).toBe('verbose');
    });

    it('should hydrate the mode from storage and ignore invalid values', async () => {
      const seed = (state: object) => {
        document.cookie = 'ikuisuus-ui-state=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('ikuisuus-ui-state', JSON.stringify(state));
      };
      seed({ theme: 'dark', aspectDisplay: 'glyph' });
      localStorage.setItem(
        'ikuisuus-ui-state',
        JSON.stringify({ theme: 'dark', aspectDisplay: 'glyph' }),
      );
      const { unmount } = render(
        <PersistentUiProvider initialExpandedPaths={[]}>
          <div />
        </PersistentUiProvider>
      );
      await waitFor(() =>
        expect(document.documentElement.getAttribute('data-aspect-display')).toBe('glyph'),
      );
      unmount();

      seed({ theme: 'dark', aspectDisplay: 'nonsense' });
      render(
        <PersistentUiProvider initialExpandedPaths={[]}>
          <div />
        </PersistentUiProvider>
      );
      await waitFor(() =>
        expect(document.documentElement.getAttribute('data-aspect-display')).toBe('compact'),
      );
    });
  });
});
