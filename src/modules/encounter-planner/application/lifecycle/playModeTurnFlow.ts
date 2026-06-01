/**
 * @fileoverview Play Mode Turn Transition Logic
 * @description Pure helpers that compute next combat state and lifecycle events for end-turn transitions.
 *
 * @module playModeTurnFlow
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { InProgressCombat } from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';
import type { PlayModeLifecycleEventMap } from './PlayModeLifecycle';

/**
 * Discriminated lifecycle event item for queued dispatch.
 *
 * @typedef {(
 *   | { eventName: 'turnEnd'; payload: PlayModeLifecycleEventMap['turnEnd'] }
 *   | { eventName: 'roundEnd'; payload: PlayModeLifecycleEventMap['roundEnd'] }
 *   | { eventName: 'roundStart'; payload: PlayModeLifecycleEventMap['roundStart'] }
 *   | { eventName: 'turnStart'; payload: PlayModeLifecycleEventMap['turnStart'] }
 * )} PendingLifecycleEvent
 */
export type PendingLifecycleEvent =
  | { eventName: 'turnEnd'; payload: PlayModeLifecycleEventMap['turnEnd'] }
  | { eventName: 'roundEnd'; payload: PlayModeLifecycleEventMap['roundEnd'] }
  | {
      eventName: 'roundStart';
      payload: PlayModeLifecycleEventMap['roundStart'];
    }
  | { eventName: 'turnStart'; payload: PlayModeLifecycleEventMap['turnStart'] };

/**
 * Function signature to resolve next active turn index.
 *
 * @typedef {(combatants: InProgressCombat['combatants'], turnOrder: string[], activeTurnIndex: number) => number} NextTurnIndexResolver
 */
export type NextTurnIndexResolver = (
  combatants: InProgressCombat['combatants'],
  turnOrder: string[],
  activeTurnIndex: number,
) => number;

/**
 * Result of computing end-turn state transition.
 *
 * @interface EndTurnTransitionResult
 * @property {InProgressCombat} nextCombat - Updated combat snapshot after end-turn
 * @property {PendingLifecycleEvent[]} lifecycleEvents - Ordered lifecycle events to emit
 */
export interface EndTurnTransitionResult {
  nextCombat: InProgressCombat;
  lifecycleEvents: PendingLifecycleEvent[];
}

/**
 * Computes the next combat state and ordered lifecycle events for an end-turn action.
 *
 * @param {InProgressCombat} previousCombat - Previous combat snapshot
 * @param {NextTurnIndexResolver} resolveNextIndex - Resolver used to find next active combatant
 * @returns {EndTurnTransitionResult} Transition result with updated combat and queued lifecycle events
 */
export function buildEndTurnTransition(
  previousCombat: InProgressCombat,
  resolveNextIndex: NextTurnIndexResolver,
): EndTurnTransitionResult {
  const nextIndex = resolveNextIndex(
    previousCombat.combatants,
    previousCombat.turnOrder,
    previousCombat.activeTurnIndex,
  );
  const isNewRound =
    nextIndex <= previousCombat.activeTurnIndex &&
    previousCombat.turnOrder.length > 0;
  const roundNumber = isNewRound
    ? previousCombat.roundNumber + 1
    : previousCombat.roundNumber;
  const endingCombatantId =
    previousCombat.turnOrder[previousCombat.activeTurnIndex] ?? null;
  const startingCombatantId = previousCombat.turnOrder[nextIndex] ?? null;
  const combatants = [...previousCombat.combatants];

  if (nextIndex < combatants.length) {
    combatants[nextIndex] = {
      ...combatants[nextIndex],
      legendaryDeedsUsed: combatants[nextIndex].legendaryDeedsUsed.map(
        () => false,
      ),
    };
  }

  const nextCombat: InProgressCombat = {
    ...previousCombat,
    combatants,
    activeTurnIndex: nextIndex,
    roundNumber,
  };

  const lifecycleEvents: PendingLifecycleEvent[] = [
    {
      eventName: 'turnEnd',
      payload: {
        previousCombat,
        nextCombat,
        endingCombatantId,
        startingCombatantId,
        previousRoundNumber: previousCombat.roundNumber,
        nextRoundNumber: roundNumber,
      },
    },
  ];

  if (isNewRound) {
    lifecycleEvents.push(
      {
        eventName: 'roundEnd',
        payload: {
          previousCombat,
          nextCombat,
          roundNumber: previousCombat.roundNumber,
        },
      },
      {
        eventName: 'roundStart',
        payload: {
          previousCombat,
          nextCombat,
          roundNumber,
        },
      },
    );
  }

  lifecycleEvents.push({
    eventName: 'turnStart',
    payload: {
      previousCombat,
      nextCombat,
      combatantId: startingCombatantId,
      combatant:
        nextCombat.combatants.find(
          (combatant) => combatant.id === startingCombatantId,
        ) ?? null,
    },
  });

  return { nextCombat, lifecycleEvents };
}
