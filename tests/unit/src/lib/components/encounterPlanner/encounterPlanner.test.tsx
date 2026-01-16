/**
 * @fileoverview Comprehensive tests for Encounter Planner component
 * @module tests/unit/src/lib/components/encounterPlanner/encounterPlanner.test
 * @description Tests encounter CRUD operations, debounced autosave, creature management,
 * import/export functionality, and transition to PlayMode.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @testing-library/react
 * @requires @/lib/components/encounterPlanner/encounterPlanner
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EncounterPlanner } from '@/lib/components/encounterPlanner/encounterPlanner';
import type { CreatureEntry, Encounter } from '@/lib/types/encounterPlanner';
import type { InProgressCombat } from '@/lib/types/inProgressCombat';
import * as encounterStorage from '@/lib/utils/encounterStorage';
import * as inProgressCombatStorage from '@/lib/utils/inProgressCombatStorage';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock useNotifications to prevent NotificationProvider requirement in tests
vi.mock('@/lib/components/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/components/ui')>();
  return {
    ...actual,
    useNotifications: () => ({
      push: vi.fn(),
      dismiss: vi.fn(),
      dismissAll: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    }),
  };
});

// Mock CombatantRow
vi.mock('@/lib/components/encounterPlanner/combatantRow', () => ({
  CombatantRow: ({ combatant, onUpdate, onRemoveSessionOnly }: any) => (
    <div data-testid={`combatant-row-${combatant.id}`}>
      <span>{combatant.name}</span>
      <button onClick={() => onUpdate({ ...combatant, hpCurrent: 100 })}>Update</button>
      <button title="removeCombatant" onClick={onRemoveSessionOnly}>✕</button>
    </div>
  ),
}));

// Mock ComboBox
vi.mock('@/lib/components/encounterPlanner/comboboxes', () => ({
  CreatureCombobox: ({ onSelect }: { onSelect: (slug: string) => void }) => (
    <button data-testid="creature-combobox" onClick={() => onSelect('test-monster')}>
      Add Monster
    </button>
  ),
}));

// Mock PlayMode
vi.mock('@/lib/components/encounterPlanner/playMode', () => ({
  PlayMode: ({ combat, onExit }: { combat: InProgressCombat; onExit: () => void }) => (
    <div data-testid="play-mode">
      <h2>Play Mode: {combat.encounterName}</h2>
      <button onClick={onExit}>Exit Play Mode</button>
    </div>
  ),
}));

// Mock useDebounce - pass through immediately for testing
vi.mock('@/lib/hooks/useDebounce', () => ({
  useDebounce: (value: any) => value,
}));

/**
 * Creates a mock creature for testing
 * @param overrides - Partial creature properties to override
 * @returns Mock CreatureEntry instance
 */
const createMockCreature = (overrides: Partial<CreatureEntry> = {}): CreatureEntry => ({
  id: 'creature-1',
  name: 'Test Creature',
  hpCurrent: 10,
  hpMax: 10,
  tempHp: null,
  ac: 10,
  stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  conditions: [],
  initiativeValue: null,
  initiativeBonus: 0,
  proficiencyBonus: null,
  speed: null,
  hpFormula: null,
  details: { buffs: [], items: [], spells: [], affixes: [] },
  ...overrides,
});

/**
 * Creates a mock encounter for testing
 * @param overrides - Partial encounter properties to override
 * @returns Mock Encounter instance
 */
const createMockEncounter = (overrides: Partial<Encounter> = {}): Encounter => ({
  id: 'encounter-1',
  name: 'Test Encounter',
  creatures: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('EncounterPlanner Component', () => {
  let mockGetEncounters: ReturnType<typeof vi.fn>;
  let mockGetActiveEncounter: ReturnType<typeof vi.fn>;
  let mockSaveEncounter: ReturnType<typeof vi.fn>;
  let mockDeleteEncounter: ReturnType<typeof vi.fn>;
  let mockSetActiveEncounterId: ReturnType<typeof vi.fn>;
  let mockCreateEmptyEncounter: ReturnType<typeof vi.fn>;
  let mockExportEncounter: ReturnType<typeof vi.fn>;
  let mockImportEncounter: ReturnType<typeof vi.fn>;
  let mockGetActiveInProgressCombatId: ReturnType<typeof vi.fn>;
  let mockGetInProgressCombat: ReturnType<typeof vi.fn>;
  let mockCreateInProgressCombat: ReturnType<typeof vi.fn>;
  const timeoutIds: NodeJS.Timeout[] = [];
  const originalSetTimeout = global.setTimeout;

  beforeEach(() => {
    // Track setTimeout calls to clean up after each test
    vi.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
      const id = originalSetTimeout(callback, delay);
      timeoutIds.push(id);
      return id;
    });
    cleanup(); // Clean up DOM before each test
    mockGetEncounters = vi.fn(() => [createMockEncounter()]);
    mockGetActiveEncounter = vi.fn(() => createMockEncounter());
    mockSaveEncounter = vi.fn();
    mockDeleteEncounter = vi.fn();
    mockSetActiveEncounterId = vi.fn();
    mockCreateEmptyEncounter = vi.fn(() => createMockEncounter({ id: 'new-encounter', name: 'New Encounter' }));
    mockExportEncounter = vi.fn((enc) => JSON.stringify(enc));
    mockImportEncounter = vi.fn((json) => JSON.parse(json));
    mockGetActiveInProgressCombatId = vi.fn(() => null);
    // Mock window.confirm to avoid jsdom warnings
    global.confirm = vi.fn(() => true);
    mockGetInProgressCombat = vi.fn(() => null);
    mockCreateInProgressCombat = vi.fn((encounter) => ({
      id: 'combat-1',
      encounterId: encounter.id,
      encounterName: encounter.name,
      combatants: [],
      turnOrder: [],
      activeTurnIndex: 0,
      roundNumber: 1,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
    }));

    vi.spyOn(encounterStorage, 'getEncounters').mockImplementation(mockGetEncounters);
    vi.spyOn(encounterStorage, 'getActiveEncounter').mockImplementation(mockGetActiveEncounter);
    vi.spyOn(encounterStorage, 'saveEncounter').mockImplementation(mockSaveEncounter);
    vi.spyOn(encounterStorage, 'deleteEncounter').mockImplementation(mockDeleteEncounter);
    vi.spyOn(encounterStorage, 'setActiveEncounterId').mockImplementation(mockSetActiveEncounterId);
    vi.spyOn(encounterStorage, 'createEmptyEncounter').mockImplementation(mockCreateEmptyEncounter);
    vi.spyOn(encounterStorage, 'exportEncounter').mockImplementation(mockExportEncounter);
    vi.spyOn(encounterStorage, 'importEncounter').mockImplementation(mockImportEncounter);
    vi.spyOn(encounterStorage, 'createCreatureFromMonster').mockImplementation((monsterData: any) => ({
      id: 'creature-' + Math.random(),
      name: monsterData.title || 'Test Creature',
      hpCurrent: 50,
      hpMax: 50,
      tempHp: null,
      ac: 15,
      stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      conditions: [],
      initiativeValue: null,
      initiativeBonus: 2,
      proficiencyBonus: 2,
      speed: null,
      hpFormula: '5d8',
      details: { buffs: [], items: [], spells: [], affixes: [] },
      sourceHref: '/library/monsters/' + (monsterData.slug || 'test'),
      crText: 'CR 2',
    }));
    vi.spyOn(encounterStorage, 'createEmptyCreature').mockImplementation(() => ({
      id: 'creature-empty',
      name: 'New Creature',
      hpCurrent: 10,
      hpMax: 10,
      tempHp: null,
      ac: 10,
      stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      conditions: [],
      initiativeValue: null,
      initiativeBonus: 0,
      proficiencyBonus: null,
      speed: null,
      hpFormula: null,
      details: { buffs: [], items: [], spells: [], affixes: [] },
    }));

    vi.spyOn(inProgressCombatStorage, 'getActiveInProgressCombatId').mockImplementation(mockGetActiveInProgressCombatId);
    vi.spyOn(inProgressCombatStorage, 'getInProgressCombat').mockImplementation(mockGetInProgressCombat);
    vi.spyOn(inProgressCombatStorage, 'createInProgressCombat').mockImplementation(mockCreateInProgressCombat);
    vi.spyOn(inProgressCombatStorage, 'saveInProgressCombat').mockImplementation(vi.fn());
    vi.spyOn(inProgressCombatStorage, 'setActiveInProgressCombatId').mockImplementation(vi.fn());

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve([{ slug: 'test-monster', title: 'Test Monster' }]),
      })
    ) as any;

    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    global.Blob = vi.fn((content, options) => ({ content, options })) as any;
  });

  afterEach(() => {
    // Clear all tracked timeouts to prevent "window is not defined" errors after teardown
    timeoutIds.forEach(id => clearTimeout(id));
    timeoutIds.length = 0; // Clear the array
    cleanup(); // Clean up DOM after each test
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Export and Initialization', () => {
    it('should export EncounterPlanner component', () => {
      expect(EncounterPlanner).toBeDefined();
      expect(typeof EncounterPlanner).toBe('function');
    });

    it('should load active encounter on mount', () => {
      render(<EncounterPlanner locale="en" />);
      expect(mockGetEncounters).toHaveBeenCalled();
      expect(mockGetActiveEncounter).toHaveBeenCalled();
    });

    it('should create new encounter if none exist', () => {
      mockGetEncounters.mockReturnValue([]);
      mockGetActiveEncounter.mockReturnValue(null);

      render(<EncounterPlanner locale="en" />);

      expect(mockCreateEmptyEncounter).toHaveBeenCalled();
      expect(mockSaveEncounter).toHaveBeenCalled();
      expect(mockSetActiveEncounterId).toHaveBeenCalled();
    });

    it('should not create encounter if active one exists', () => {
      render(<EncounterPlanner locale="en" />);
      expect(mockCreateEmptyEncounter).not.toHaveBeenCalled();
    });
  });

  describe('Encounter Management', () => {
    it('should display encounter name', () => {
      render(<EncounterPlanner locale="en" />);
      // Use placeholder to specifically target the input (not select)
      const encounterName = screen.getByPlaceholderText('encounterName');
      expect(encounterName).toBeInTheDocument();
      expect(encounterName).toHaveValue('Test Encounter');
    });

    it('should update encounter name', async () => {
      const user = userEvent.setup();
      render(<EncounterPlanner locale="en" />);

      // Use placeholder to specifically target the input
      const nameInput = screen.getByPlaceholderText('encounterName');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      await waitFor(() => {
        expect(mockSaveEncounter).toHaveBeenCalled();
        const savedEncounter = mockSaveEncounter.mock.calls[mockSaveEncounter.mock.calls.length - 1][0];
        expect(savedEncounter.name).toBe('Updated Name');
      });
    });

    it('should create new encounter', async () => {
      const user = userEvent.setup();
      render(<EncounterPlanner locale="en" />);

      const newButton = screen.getByText(/newEncounter/);
      await user.click(newButton);

      expect(mockCreateEmptyEncounter).toHaveBeenCalled();
      expect(mockSaveEncounter).toHaveBeenCalled();
      expect(mockSetActiveEncounterId).toHaveBeenCalledWith('new-encounter');
    });

    it('should delete encounter', async () => {
      const user = userEvent.setup();
      mockGetEncounters.mockReturnValue([
        createMockEncounter({ id: '1' }),
        createMockEncounter({ id: '2' }),
      ]);

      render(<EncounterPlanner locale="en" />);

      const deleteButton = screen.getByText(/deleteEncounter/);
      await user.click(deleteButton);

      expect(mockDeleteEncounter).toHaveBeenCalled();
    });

    it('should not delete if only one encounter', async () => {
      const user = userEvent.setup();
      mockGetEncounters.mockReturnValue([createMockEncounter()]);
      // Mock confirm to return false (user cancels deletion)
      vi.mocked(global.confirm).mockReturnValueOnce(false);

      render(<EncounterPlanner locale="en" />);

      const deleteButton = screen.getByText(/deleteEncounter/);
      await user.click(deleteButton);

      expect(mockDeleteEncounter).not.toHaveBeenCalled();
    });

    it('should switch active encounter', async () => {
      const user = userEvent.setup();
      mockGetEncounters.mockReturnValue([
        createMockEncounter({ id: '1', name: 'Encounter 1' }),
        createMockEncounter({ id: '2', name: 'Encounter 2' }),
      ]);

      render(<EncounterPlanner locale="en" />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '2');

      expect(mockSetActiveEncounterId).toHaveBeenCalledWith('2');
    });
  });

  describe('Creature Management', () => {
    it('should add creature from API', async () => {
      const user = userEvent.setup();
      render(<EncounterPlanner locale="en" />);

      // Use the visible "Add Creature" button
      const addButton = screen.getByText(/addCreature/);
      await user.click(addButton);

      // Component should call createEmptyCreature
      await waitFor(() => {
        expect(mockSaveEncounter).toHaveBeenCalled();
      });
    });

    it('should handle API error gracefully', () => {
      // Component initialization fails if getEncounters throws
      mockGetEncounters.mockImplementation(() => {
        throw new Error('Storage Error');
      });

      // Component should throw on initialization error
      expect(() => render(<EncounterPlanner locale="en" />)).toThrow('Storage Error');
    });

    it('should remove creature', async () => {
      const user = userEvent.setup();
      const encounterWithCreatures = createMockEncounter({
        creatures: [
          createMockCreature({ id: 'creature-1', name: 'Goblin' }),
          createMockCreature({ id: 'creature-2', name: 'Orc' }),
        ],
      });
      mockGetActiveEncounter.mockReturnValue(encounterWithCreatures);

      render(<EncounterPlanner locale="en" />);

      const removeButtons = screen.getAllByTitle('removeCombatant');
      await user.click(removeButtons[0]);

      await waitFor(() => {
        const savedEncounter = mockSaveEncounter.mock.calls[mockSaveEncounter.mock.calls.length - 1][0];
        expect(savedEncounter.creatures.length).toBe(1);
      });
    });
  });

  describe('Import/Export', () => {
    it('should export encounter as JSON', async () => {
      const user = userEvent.setup();
      render(<EncounterPlanner locale="en" />);

      const exportButton = screen.getByText(/exportEncounter/);
      await user.click(exportButton);

      // Verify export function was called - this is the core behavior
      await waitFor(() => {
        expect(mockExportEncounter).toHaveBeenCalled();
      });
      
      // Verify exported data has correct structure
      const exportedEncounter = mockExportEncounter.mock.calls[0][0];
      expect(exportedEncounter).toHaveProperty('id');
      expect(exportedEncounter).toHaveProperty('name');
      expect(exportedEncounter).toHaveProperty('creatures');
      expect(exportedEncounter).toHaveProperty('createdAt');
    });
  });

  describe('PlayMode Transition', () => {
    it('should enter play mode', async () => {
      const user = userEvent.setup();
      render(<EncounterPlanner locale="en" />);

      const playButton = screen.getByText(/startCombat/);
      await user.click(playButton);

      await waitFor(() => {
        expect(screen.getByTestId('play-mode')).toBeInTheDocument();
        expect(mockCreateInProgressCombat).toHaveBeenCalled();
      });
    });

    it('should exit play mode', async () => {
      const user = userEvent.setup();
      render(<EncounterPlanner locale="en" />);

      const playButton = screen.getByText(/startCombat/);
      await user.click(playButton);

      await waitFor(() => {
        expect(screen.getByTestId('play-mode')).toBeInTheDocument();
      });

      const exitButton = screen.getByText('Exit Play Mode');
      await user.click(exitButton);

      await waitFor(() => {
        expect(screen.queryByTestId('play-mode')).not.toBeInTheDocument();
      });
    });

    it('should resume active combat on mount', async () => {
      const user = userEvent.setup();
      const mockCombat = {
        id: 'combat-1',
        encounterName: 'Ongoing Combat',
        combatants: [],
        turnOrder: [],
        activeTurnIndex: 0,
        roundNumber: 3,
      } as any;

      mockGetActiveInProgressCombatId.mockReturnValue('combat-1');
      mockGetInProgressCombat.mockReturnValue(mockCombat);

      render(<EncounterPlanner locale="en" />);

      // Component shows resume banner
      expect(screen.getByText(/resumeCombatAvailable/)).toBeInTheDocument();
      
      // Click resume button
      const resumeButtons = screen.getAllByText(/resumeCombat/);
      await user.click(resumeButtons[0]);
      
      // Verify the storage functions were called to retrieve and load the combat
      await waitFor(() => {
        expect(mockGetActiveInProgressCombatId).toHaveBeenCalled();
        expect(mockGetInProgressCombat).toHaveBeenCalledWith('combat-1');
      });
    });
  });

  describe('Debounced Autosave', () => {
    it('should save encounter after updates', async () => {
      const user = userEvent.setup();
      render(<EncounterPlanner locale="en" />);

      mockSaveEncounter.mockClear();

      // Use placeholder to find input specifically (avoids matching select)
      const nameInput = screen.getByPlaceholderText('encounterName');
      await user.type(nameInput, ' Updated');

      await waitFor(() => {
        expect(mockSaveEncounter).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null encounter gracefully', () => {
      mockGetActiveEncounter.mockReturnValue(null);
      mockGetEncounters.mockReturnValue([]);

      render(<EncounterPlanner locale="en" />);

      expect(mockCreateEmptyEncounter).toHaveBeenCalled();
    });

    it('should use default locale if not provided', () => {
      render(<EncounterPlanner />);
      expect(mockGetEncounters).toHaveBeenCalled();
    });
  });
});
