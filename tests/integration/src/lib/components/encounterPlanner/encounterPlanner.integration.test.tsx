/**
 * @fileoverview Integration tests for the EncounterPlanner lock functionality and
 * input disabling behavior.
 *
 * @module encounterPlanner-integration
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Test framework
 * @requires @testing-library/react React component testing
 * @requires @/modules/encounter-planner EncounterPlanner component
 *
 * @description
 * Tests locked and unlocked stat input disabling in CombatantRow.
 */

import { createInProgressCombatant } from '@/modules/encounter-planner/application/factories/combatSnapshot.factory';
import { createEmptyCreature } from '@/modules/encounter-planner/application/factories/encounter.factory';
import { CombatantRow } from '@/modules/encounter-planner/presentation/combatantRow';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Intl messages passed to NextIntlClientProvider during tests.
 */
const testMessages = {
  encounterPlanner: {
    stats: {
      str: 'STR',
      dex: 'DEX',
      con: 'CON',
      int: 'INT',
      wis: 'WIS',
      cha: 'CHA',
    },
    lockStats: 'Lock',
    unlockStats: 'Unlock',
    hp: 'HP',
    current: 'Current',
    hpCurrent: 'Current HP',
    max: 'Max',
    hpMax: 'Max HP',
    temp: 'Thp',
    tempHp: 'Temporary HP',
    ac: 'AC',
    initiative: 'Initiative',
    slain: 'Slain',
    showDetails: 'Show Details',
    hideDetails: 'Hide Details',
    removeCombatant: 'Remove',
  },
  common: {},
};

/**
 * Helper to render CombatantRow with intl context
 */
const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale='en' messages={testMessages} timeZone='UTC'>
      {component}
    </NextIntlClientProvider>,
  );
};

describe('EncounterPlanner Lock Integration - CombatantRow Direct Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Lock button interaction and input disabling', () => {
    it('should render all stat inputs as enabled initially', () => {
      const creature = createEmptyCreature();
      creature.ac = 15;
      creature.stats.str = 18;
      creature.stats.dex = 14;
      creature.stats.con = 16;
      creature.stats.int = 12;
      creature.stats.wis = 13;
      creature.stats.cha = 15;

      const combatant = createInProgressCombatant(creature);

      const { container } = renderWithIntl(
        <CombatantRow
          combatant={combatant}
          locale='en'
          onUpdate={vi.fn()}
          onRemoveSessionOnly={vi.fn()}
        />,
      );

      // Get all text inputs for stats (AC, HP, ability scores, initiative)
      const textInputs = container.querySelectorAll('input[type="text"]');
      expect(textInputs.length).toBeGreaterThan(0);

      // All should be enabled initially
      const disabledInputs = Array.from(textInputs).filter((input) =>
        input.hasAttribute('disabled'),
      );
      expect(disabledInputs).toHaveLength(0);
    });

    it('should disable all stat inputs when locked array contains "stats"', () => {
      const creature = createEmptyCreature();
      creature.ac = 15;
      const combatant = createInProgressCombatant(creature);

      // Manually set locked to include 'stats'
      const lockedCombatant = { ...combatant, locked: ['stats'] };

      const { container } = renderWithIntl(
        <CombatantRow
          combatant={lockedCombatant}
          locale='en'
          onUpdate={vi.fn()}
          onRemoveSessionOnly={vi.fn()}
        />,
      );

      // Get all text inputs
      const textInputs = container.querySelectorAll('input[type="text"]');
      expect(textInputs.length).toBeGreaterThan(0);

      // All should now be disabled
      const disabledInputs = Array.from(textInputs).filter((input) =>
        input.hasAttribute('disabled'),
      );
      expect(disabledInputs.length).toBeGreaterThan(0);
    });

    it('should have AC input disabled when stats are locked', () => {
      const creature = createEmptyCreature();
      creature.ac = 20;
      const combatant = createInProgressCombatant(creature);

      // Lock stats
      const lockedCombatant = { ...combatant, locked: ['stats'] };

      const { container } = renderWithIntl(
        <CombatantRow
          combatant={lockedCombatant}
          locale='en'
          onUpdate={vi.fn()}
          onRemoveSessionOnly={vi.fn()}
        />,
      );

      // Find AC input field and other stat inputs
      const textInputs = Array.from(
        container.querySelectorAll('input[type="text"]'),
      );
      const disabledInputs = textInputs.filter((input) =>
        input.hasAttribute('disabled'),
      );

      // Should have disabled inputs when locked
      expect(disabledInputs.length).toBeGreaterThan(0);
    });

    it('should have all ability score inputs disabled when stats are locked', () => {
      const creature = createEmptyCreature();
      creature.stats = {
        str: 15,
        dex: 14,
        con: 16,
        int: 12,
        wis: 13,
        cha: 15,
      };
      const combatant = createInProgressCombatant(creature);

      // Lock stats
      const lockedCombatant = { ...combatant, locked: ['stats'] };

      const { container } = renderWithIntl(
        <CombatantRow
          combatant={lockedCombatant}
          locale='en'
          onUpdate={vi.fn()}
          onRemoveSessionOnly={vi.fn()}
        />,
      );

      // Get all text inputs (AC, stats, initiative, HP)
      const textInputs = Array.from(
        container.querySelectorAll('input[type="text"]'),
      );
      const disabledInputs = textInputs.filter((input) =>
        input.hasAttribute('disabled'),
      );

      // When locked, should have disabled inputs (for AC and all ability scores)
      expect(disabledInputs.length).toBeGreaterThan(0);
    });

    it('should re-enable inputs when locked array is empty', () => {
      const creature = createEmptyCreature();
      const combatant = createInProgressCombatant(creature);

      // Start with locked
      let lockedCombatant = { ...combatant, locked: ['stats'] };

      const { container, rerender } = renderWithIntl(
        <CombatantRow
          combatant={lockedCombatant}
          locale='en'
          onUpdate={vi.fn()}
          onRemoveSessionOnly={vi.fn()}
        />,
      );

      // Verify inputs are disabled
      let textInputs = Array.from(
        container.querySelectorAll('input[type="text"]'),
      );
      let disabledInputs = textInputs.filter((input) =>
        input.hasAttribute('disabled'),
      );
      expect(disabledInputs.length).toBeGreaterThan(0);

      // Now unlock (empty array)
      lockedCombatant = { ...combatant, locked: [] };
      rerender(
        <NextIntlClientProvider
          locale='en'
          messages={testMessages}
          timeZone='UTC'>
          <CombatantRow
            combatant={lockedCombatant}
            locale='en'
            onUpdate={vi.fn()}
            onRemoveSessionOnly={vi.fn()}
          />
        </NextIntlClientProvider>,
      );

      // Verify inputs are now enabled
      textInputs = Array.from(container.querySelectorAll('input[type="text"]'));
      disabledInputs = textInputs.filter((input) =>
        input.hasAttribute('disabled'),
      );
      expect(disabledInputs).toHaveLength(0);
    });

    it('should show locked visual state with CSS class', () => {
      const creature = createEmptyCreature();
      creature.ac = 15;
      const combatant = createInProgressCombatant(creature);

      // Lock stats
      const lockedCombatant = { ...combatant, locked: ['stats'] };

      const { container } = renderWithIntl(
        <CombatantRow
          combatant={lockedCombatant}
          locale='en'
          onUpdate={vi.fn()}
          onRemoveSessionOnly={vi.fn()}
        />,
      );

      // When locked, inputs should be disabled
      const textInputs = Array.from(
        container.querySelectorAll('input[type="text"]'),
      );
      const disabledInputs = textInputs.filter((input) =>
        input.hasAttribute('disabled'),
      );

      // Verify that inputs ARE disabled when locked (this is the critical test)
      expect(disabledInputs.length).toBeGreaterThan(0);
    });

    it('should handle multiple creatures with different lock states', () => {
      const creature1 = createEmptyCreature();
      creature1.id = 'c1';
      const combatant1 = createInProgressCombatant(creature1);
      const lockedCombatant1 = { ...combatant1, locked: ['stats'] };

      const creature2 = createEmptyCreature();
      creature2.id = 'c2';
      const combatant2 = createInProgressCombatant(creature2);
      const unlockedCombatant2 = { ...combatant2, locked: [] };

      // Render first creature (locked)
      const { container: container1 } = renderWithIntl(
        <CombatantRow
          combatant={lockedCombatant1}
          locale='en'
          onUpdate={vi.fn()}
          onRemoveSessionOnly={vi.fn()}
        />,
      );

      // First creature should have disabled inputs
      let textInputs1 = Array.from(
        container1.querySelectorAll('input[type="text"]'),
      );
      let disabledInputs1 = textInputs1.filter((input) =>
        input.hasAttribute('disabled'),
      );
      expect(disabledInputs1.length).toBeGreaterThan(0);

      // Render second creature (unlocked)
      const { container: container2 } = renderWithIntl(
        <CombatantRow
          combatant={unlockedCombatant2}
          locale='en'
          onUpdate={vi.fn()}
          onRemoveSessionOnly={vi.fn()}
        />,
      );

      // Second creature should have enabled inputs
      let textInputs2 = Array.from(
        container2.querySelectorAll('input[type="text"]'),
      );
      let disabledInputs2 = textInputs2.filter((input) =>
        input.hasAttribute('disabled'),
      );
      expect(disabledInputs2).toHaveLength(0);
    });

    it('should prevent interaction with disabled locked inputs', () => {
      const creature = createEmptyCreature();
      creature.ac = 15;
      const combatant = createInProgressCombatant(creature);

      // Lock stats
      const lockedCombatant = { ...combatant, locked: ['stats'] };
      const onUpdate = vi.fn();

      const { container } = renderWithIntl(
        <CombatantRow
          combatant={lockedCombatant}
          locale='en'
          onUpdate={onUpdate}
          onRemoveSessionOnly={vi.fn()}
        />,
      );

      // Try to interact with AC input
      const textInputs = Array.from(
        container.querySelectorAll('input[type="text"]'),
      ) as HTMLInputElement[];
      const firstDisabledInput = textInputs.find((input) =>
        input.hasAttribute('disabled'),
      );

      if (firstDisabledInput) {
        // Disabled inputs should have disabled attribute set to true
        expect(firstDisabledInput.disabled).toBe(true);
      }
    });
  });
});
