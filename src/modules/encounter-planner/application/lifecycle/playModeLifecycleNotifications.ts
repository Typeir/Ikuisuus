/**
 * @fileoverview Play Mode Lifecycle Notification Subscriptions
 * @description Registers lifecycle subscribers for round/lair and legendary deed reminders.
 *
 * @module playModeLifecycleNotifications
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { useEffect } from 'react';
import type { PlayModeLifecycle } from './PlayModeLifecycle';

/**
 * Translation function shape for encounter planner messages.
 *
 * @typedef {(key: string, values?: Record<string, string | number>) => string} EncounterTranslator
 */
export type EncounterTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

/**
 * Hook parameters for lifecycle notification registration.
 *
 * @interface UsePlayModeLifecycleNotificationsParams
 * @property {PlayModeLifecycle} lifecycle - Event dispatcher instance
 * @property {NotificationContextValue} notifications - Notification context API
 * @property {EncounterTranslator} t - Translation function for encounter planner namespace
 */
export interface UsePlayModeLifecycleNotificationsParams {
  lifecycle: PlayModeLifecycle;
  notifications: {
    info: (
      message: string,
      options?: { title?: string; duration?: number },
    ) => string;
    warning: (
      message: string,
      options?: { title?: string; duration?: number },
    ) => string;
  };
  t: EncounterTranslator;
}

/**
 * Registers notification subscribers for Play Mode lifecycle events.
 *
 * @param {UsePlayModeLifecycleNotificationsParams} params - Hook parameters
 * @param {PlayModeLifecycle} params.lifecycle - Event dispatcher instance
 * @param {{info: (message: string, options?: { title?: string; duration?: number }) => string, warning: (message: string, options?: { title?: string; duration?: number }) => string}} params.notifications - Notification callbacks used by lifecycle subscriptions
 * @param {EncounterTranslator} params.t - Translation function for encounter planner namespace
 * @returns {void}
 */
export function usePlayModeLifecycleNotifications({
  lifecycle,
  notifications,
  t,
}: UsePlayModeLifecycleNotificationsParams): void {
  useEffect(() => {
    return lifecycle.on('roundEnd', (payload) => {
      const lairCombatantsWithDeeds = payload.previousCombat.combatants.filter(
        (combatant) =>
          !combatant.slain &&
          combatant.mechanics?.lair &&
          combatant.legendaryDeedsUsed.some((used) => !used),
      );

      if (lairCombatantsWithDeeds.length > 0) {
        const creatureNames = lairCombatantsWithDeeds
          .map((combatant) => combatant.name)
          .join(', ');

        notifications.warning(
          t('lairAlertRoundEnd', {
            round: payload.roundNumber,
            creatures: creatureNames,
          }),
          {
            title: t('lairAlertTitle'),
            duration: 8000,
          },
        );
      }
    });
  }, [lifecycle, notifications, t]);

  useEffect(() => {
    return lifecycle.on('roundStart', (payload) => {
      const lairCombatantsWithDeeds = payload.nextCombat.combatants.filter(
        (combatant) =>
          !combatant.slain &&
          combatant.mechanics?.lair &&
          combatant.legendaryDeedsUsed.some((used) => !used),
      );

      if (lairCombatantsWithDeeds.length > 0) {
        const creatureNames = lairCombatantsWithDeeds
          .map((combatant) => combatant.name)
          .join(', ');

        notifications.warning(t('lairAlert', { creatures: creatureNames }), {
          title: t('lairAlertTitle'),
          duration: 8000,
        });
      }
    });
  }, [lifecycle, notifications, t]);

  useEffect(() => {
    return lifecycle.on('turnStart', (payload) => {
      if (!payload.combatant || payload.combatant.slain) {
        return;
      }

      if (payload.combatant.mechanics?.stratagem) {
        notifications.info(
          t('stratagemTurnStartAlert', { name: payload.combatant.name }),
          {
            title: t('stratagem'),
            duration: 5000,
          },
        );
      }
    });
  }, [lifecycle, notifications, t]);

  useEffect(() => {
    return lifecycle.on('turnEnd', (payload) => {
      const endingCombatant = payload.previousCombat.combatants.find(
        (combatant) => combatant.id === payload.endingCombatantId,
      );

      if (
        endingCombatant &&
        !endingCombatant.slain &&
        endingCombatant.mechanics?.stratagem
      ) {
        notifications.info(
          t('stratagemTurnEndAlert', { name: endingCombatant.name }),
          {
            title: t('stratagem'),
            duration: 5000,
          },
        );
      }
    });
  }, [lifecycle, notifications, t]);

  useEffect(() => {
    return lifecycle.on('turnEnd', (payload) => {
      const deedReadyCombatants = payload.nextCombat.combatants.filter(
        (combatant) =>
          !combatant.slain &&
          combatant.mechanics?.legendaryDeed &&
          combatant.legendaryDeedsUsed.some((used) => !used) &&
          combatant.id !== payload.endingCombatantId &&
          combatant.id !== payload.startingCombatantId,
      );

      deedReadyCombatants.forEach((combatant) => {
        notifications.info(t('legendaryDeedReady', { name: combatant.name }), {
          title: t('legendaryDeeds'),
          duration: 5000,
        });
      });
    });
  }, [lifecycle, notifications, t]);
}
