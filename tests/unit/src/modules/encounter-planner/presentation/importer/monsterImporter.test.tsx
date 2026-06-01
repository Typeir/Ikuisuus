/**
 * @fileoverview Tests for MonsterImporter Component
 * @module tests/unit/src/lib/components/encounterPlanner/importer/monsterImporter.test
 * @description Tests creature selection, quantity popup flow, confirm/cancel behavior,
 * API integration via monsterCache, and multiple creature imports.
 *
 * @version 1.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @testing-library/react
 * @requires @/modules/encounter-planner/presentation/importer
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createUseTranslationsMock,
    loadMessageFile,
} from '../../../../lib/testUtils/translationMockUtils';

vi.mock('next-intl', () => ({
  useTranslations: createUseTranslationsMock({
    encounterPlanner: loadMessageFile('messages/en/encounterPlanner.json'),
  }),
  useLocale: () => 'en',
}));

vi.mock('@/lib/utils/monsterCache', () => {
  const mockMonsterData = {
    slug: 'goblin',
    title: 'Goblin',
    cr: '1/4',
    size: 'small',
    creatureType: 'humanoid',
    ac: { value: 15, raw: '15 (leather armor, shield)' },
    hp: { average: 7, formula: '2d6', raw: '7 (2d6)' },
    abilities: {
      str: { score: 8, mod: -1 },
      dex: { score: 14, mod: 2 },
      con: { score: 10, mod: 0 },
      int: { score: 10, mod: 0 },
      wis: { score: 8, mod: -1 },
      cha: { score: 8, mod: -1 },
    },
    speed: { raw: '30 ft.', modes: { walk: 30 } },
    tags: ['creature:humanoid', 'size:small'],
  };

  return {
    getMonsterIndex: vi.fn().mockResolvedValue([
      {
        slug: 'goblin',
        title: 'Goblin',
        cr: '1/4',
        size: 'small',
        creatureType: 'humanoid',
      },
      {
        slug: 'ancient-red-dragon',
        title: 'Ancient Red Dragon',
        cr: '24',
        size: 'gargantuan',
        creatureType: 'dragon',
      },
      {
        slug: 'orc',
        title: 'Orc',
        cr: '1/2',
        size: 'medium',
        creatureType: 'humanoid',
      },
    ]),
    getMonsterBySlug: vi.fn().mockResolvedValue(mockMonsterData),
  };
});

import { MonsterImporter } from '@/modules/encounter-planner/presentation/importer';

/**
 * Helper to select a creature from the combobox dropdown
 */
async function selectCreature(
  user: ReturnType<typeof userEvent.setup>,
  creatureName: string,
) {
  const input = screen.getByPlaceholderText('Search creatures...');
  await user.click(input);
  await user.type(input, creatureName.substring(0, 3));

  await waitFor(
    () => {
      const items = screen.queryAllByText(creatureName);
      expect(items.length).toBeGreaterThan(0);
    },
    { timeout: 3000 },
  );

  const listItem = screen.getAllByText(creatureName)[0];
  await user.click(listItem);
}

describe('MonsterImporter Component', () => {
  let mockOnImport: ReturnType<typeof vi.fn>;
  let mockFetch: ReturnType<typeof vi.fn>;

  const mockMonsterData = {
    slug: 'goblin',
    title: 'Goblin',
    cr: '1/4',
    size: 'small',
    creatureType: 'humanoid',
    ac: { value: 15, raw: '15 (leather armor, shield)' },
    hp: { average: 7, formula: '2d6', raw: '7 (2d6)' },
    abilities: {
      str: { score: 8, mod: -1 },
      dex: { score: 14, mod: 2 },
      con: { score: 10, mod: 0 },
      int: { score: 10, mod: 0 },
      wis: { score: 8, mod: -1 },
      cha: { score: 8, mod: -1 },
    },
    speed: { raw: '30 ft.', modes: { walk: 30 } },
    tags: ['creature:humanoid', 'size:small'],
  };

  const mockMonsterIndex = [
    {
      slug: 'goblin',
      title: 'Goblin',
      cr: '1/4',
      size: 'small',
      creatureType: 'humanoid',
    },
    {
      slug: 'ancient-red-dragon',
      title: 'Ancient Red Dragon',
      cr: '24',
      size: 'gargantuan',
      creatureType: 'dragon',
    },
    {
      slug: 'orc',
      title: 'Orc',
      cr: '1/2',
      size: 'medium',
      creatureType: 'humanoid',
    },
  ];

  beforeEach(() => {
    cleanup();
    mockOnImport = vi.fn();
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/monsters/index')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMonsterIndex),
        });
      }
      if (
        url.includes('/api/monsters/goblin') ||
        url.includes('/api/monsters/orc')
      ) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMonsterData),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
      });
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should export MonsterImporter component', () => {
      expect(MonsterImporter).toBeDefined();
      expect(typeof MonsterImporter).toBe('function');
    });

    it('should render search input', () => {
      render(<MonsterImporter onImport={mockOnImport} />);

      expect(
        screen.getByPlaceholderText('Search creatures...'),
      ).toBeInTheDocument();
    });

    it('should not show quantity popup initially', () => {
      render(<MonsterImporter onImport={mockOnImport} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Selection Flow', () => {
    it('should show quantity popup when creature is selected', async () => {
      const user = userEvent.setup();
      render(<MonsterImporter onImport={mockOnImport} />);

      await selectCreature(user, 'Goblin');

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should display creature name in quantity popup', async () => {
      const user = userEvent.setup();
      render(<MonsterImporter onImport={mockOnImport} />);

      await selectCreature(user, 'Goblin');

      await waitFor(() => {
        const dialogs = screen.getAllByText('Goblin');
        expect(dialogs.length).toBeGreaterThan(0);
      });
    });

    it('should focus confirm button when popup opens', async () => {
      const user = userEvent.setup();
      render(<MonsterImporter onImport={mockOnImport} />);

      await selectCreature(user, 'Goblin');

      await waitFor(() => {
        expect(
          screen.getByText('Add Creature').closest('button'),
        ).toHaveFocus();
      });
    });
  });

  describe('Confirm Import', () => {
    it('should call onImport with monster data and quantity on confirm', async () => {
      const user = userEvent.setup();
      render(<MonsterImporter onImport={mockOnImport} />);

      await selectCreature(user, 'Goblin');
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument(),
      );
      await user.click(screen.getByText('Add Creature').closest('button')!);

      await waitFor(() => {
        expect(mockOnImport).toHaveBeenCalledTimes(1);
        expect(mockOnImport).toHaveBeenCalledWith(mockMonsterData, 1);
      });
    });

    it('should call onImport with correct quantity when changed', async () => {
      const user = userEvent.setup();
      render(<MonsterImporter onImport={mockOnImport} />);

      await selectCreature(user, 'Goblin');
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument(),
      );

      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '5');
      await user.click(screen.getByText('Add Creature').closest('button')!);

      await waitFor(() => {
        expect(mockOnImport).toHaveBeenCalledWith(mockMonsterData, 5);
      });
    });

    it('should close popup after confirm', async () => {
      const user = userEvent.setup();
      render(<MonsterImporter onImport={mockOnImport} />);

      await selectCreature(user, 'Goblin');
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument(),
      );
      await user.click(screen.getByText('Add Creature').closest('button')!);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Cancel Import', () => {
    it('should close popup on cancel without calling onImport', async () => {
      const user = userEvent.setup();
      render(<MonsterImporter onImport={mockOnImport} />);

      await selectCreature(user, 'Goblin');
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument(),
      );
      await user.click(screen.getByText('Cancel').closest('button')!);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      expect(mockOnImport).not.toHaveBeenCalled();
    });
  });

  describe('API Integration', () => {
    it('should fetch monster data by slug on confirm', async () => {
      const user = userEvent.setup();
      render(<MonsterImporter onImport={mockOnImport} />);

      await selectCreature(user, 'Goblin');
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument(),
      );
      await user.click(screen.getByText('Add Creature').closest('button')!);

      await waitFor(() => {
        expect(mockOnImport).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onImport when creature is successfully imported', async () => {
      const user = userEvent.setup();
      render(<MonsterImporter onImport={mockOnImport} />);

      await selectCreature(user, 'Goblin');
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument(),
      );
      await user.click(screen.getByText('Add Creature').closest('button')!);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      expect(mockOnImport).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'goblin' }),
        1,
      );
    });

    it('should not call onImport if monster not found', async () => {
      const { getMonsterBySlug } = await import('@/lib/utils/monsterCache');
      vi.mocked(getMonsterBySlug).mockResolvedValueOnce(null);

      const user = userEvent.setup();
      render(<MonsterImporter onImport={mockOnImport} />);

      await selectCreature(user, 'Goblin');
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument(),
      );
      await user.click(screen.getByText('Add Creature').closest('button')!);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      expect(mockOnImport).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should disable input when disabled prop is true', () => {
      render(<MonsterImporter onImport={mockOnImport} disabled={true} />);

      const input = screen.getByPlaceholderText('Search creatures...');
      expect(input).toBeDisabled();
    });
  });

  describe('Multiple Imports', () => {
    it('should allow importing different creatures sequentially', async () => {
      const user = userEvent.setup();
      render(<MonsterImporter onImport={mockOnImport} />);

      await selectCreature(user, 'Goblin');
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument(),
      );
      await user.click(screen.getByText('Add Creature').closest('button')!);
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );

      await selectCreature(user, 'Orc');
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument(),
      );
      await user.click(screen.getByText('Add Creature').closest('button')!);

      await waitFor(() => {
        expect(mockOnImport).toHaveBeenCalledTimes(2);
      });
    });
  });
});
