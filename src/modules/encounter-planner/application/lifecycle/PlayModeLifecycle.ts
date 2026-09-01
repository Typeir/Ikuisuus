/**
 * @fileoverview Play Mode Lifecycle Event Dispatcher
 * @description Event-driven lifecycle hooks for turn and round transitions.
 *
 * @module modules/encounter-planner/application/lifecycle/PlayModeLifecycle
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type {
    InProgressCombat,
    InProgressCombatant,
} from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';

/**
 * Turn end lifecycle event payload.
 *
 * @interface TurnEndEventPayload
 * @property {InProgressCombat} previousCombat - Combat state before transition
 * @property {InProgressCombat} nextCombat - Combat state after transition
 * @property {string|null} endingCombatantId - Combatant whose turn ended
 * @property {string|null} startingCombatantId - Combatant whose turn started
 * @property {number} previousRoundNumber - Previous round number
 * @property {number} nextRoundNumber - Next round number
 */
export interface TurnEndEventPayload {
  previousCombat: InProgressCombat;
  nextCombat: InProgressCombat;
  endingCombatantId: string | null;
  startingCombatantId: string | null;
  previousRoundNumber: number;
  nextRoundNumber: number;
}

/**
 * Round end lifecycle event payload.
 *
 * @interface RoundEndEventPayload
 * @property {InProgressCombat} previousCombat - Combat state before transition
 * @property {InProgressCombat} nextCombat - Combat state after transition
 * @property {number} roundNumber - Round number that ended
 */
export interface RoundEndEventPayload {
  previousCombat: InProgressCombat;
  nextCombat: InProgressCombat;
  roundNumber: number;
}

/**
 * Round start lifecycle event payload.
 *
 * @interface RoundStartEventPayload
 * @property {InProgressCombat} previousCombat - Combat state before transition
 * @property {InProgressCombat} nextCombat - Combat state after transition
 * @property {number} roundNumber - Round number that started
 */
export interface RoundStartEventPayload {
  previousCombat: InProgressCombat;
  nextCombat: InProgressCombat;
  roundNumber: number;
}

/**
 * Turn start lifecycle event payload.
 *
 * @interface TurnStartEventPayload
 * @property {InProgressCombat} previousCombat - Combat state before transition
 * @property {InProgressCombat} nextCombat - Combat state after transition
 * @property {string|null} combatantId - Combatant whose turn started
 * @property {InProgressCombatant|null} combatant - Resolved combatant data for started turn
 */
export interface TurnStartEventPayload {
  previousCombat: InProgressCombat;
  nextCombat: InProgressCombat;
  combatantId: string | null;
  combatant: InProgressCombatant | null;
}

/**
 * Lifecycle event map for Play Mode transitions.
 *
 * @interface PlayModeLifecycleEventMap
 * @property {TurnEndEventPayload} turnEnd - Emitted when current turn ends
 * @property {RoundEndEventPayload} roundEnd - Emitted before a new round starts
 * @property {RoundStartEventPayload} roundStart - Emitted when a new round starts
 * @property {TurnStartEventPayload} turnStart - Emitted when next combatant turn starts
 */
export interface PlayModeLifecycleEventMap {
  turnEnd: TurnEndEventPayload;
  roundEnd: RoundEndEventPayload;
  roundStart: RoundStartEventPayload;
  turnStart: TurnStartEventPayload;
}

/**
 * Subscriber signature for Play Mode lifecycle events.
 *
 * @template K
 * @typedef {(payload: PlayModeLifecycleEventMap[K]) => void} LifecycleSubscriber
 */
type LifecycleSubscriber<K extends keyof PlayModeLifecycleEventMap> = (
  payload: PlayModeLifecycleEventMap[K],
) => void;

/**
 * Unsubscribe callback type.
 *
 * @typedef {() => void} Unsubscribe
 */
type Unsubscribe = () => void;

/**
 * Event dispatcher for Play Mode lifecycle hooks.
 *
 * @class PlayModeLifecycle
 */
export class PlayModeLifecycle {
  private subscribers: {
    [K in keyof PlayModeLifecycleEventMap]: Set<LifecycleSubscriber<K>>;
  } = {
    turnEnd: new Set<LifecycleSubscriber<'turnEnd'>>(),
    roundEnd: new Set<LifecycleSubscriber<'roundEnd'>>(),
    roundStart: new Set<LifecycleSubscriber<'roundStart'>>(),
    turnStart: new Set<LifecycleSubscriber<'turnStart'>>(),
  };

  /**
   * Registers a subscriber for a lifecycle event.
   *
   * @template K
   * @param {K} eventName - Lifecycle event name
   * @param {LifecycleSubscriber<K>} subscriber - Event subscriber callback
   * @returns {Unsubscribe} Cleanup function to remove subscriber
   */
  public on<K extends keyof PlayModeLifecycleEventMap>(
    eventName: K,
    subscriber: LifecycleSubscriber<K>,
  ): Unsubscribe {
    const eventSubscribers = this.subscribers[eventName] as Set<
      LifecycleSubscriber<K>
    >;
    eventSubscribers.add(subscriber);
    return () => {
      eventSubscribers.delete(subscriber);
    };
  }

  /**
   * Emits a lifecycle event to all subscribers.
   *
   * @template K
   * @param {K} eventName - Lifecycle event name
   * @param {PlayModeLifecycleEventMap[K]} payload - Event payload
   * @returns {void}
   */
  public emit<K extends keyof PlayModeLifecycleEventMap>(
    eventName: K,
    payload: PlayModeLifecycleEventMap[K],
  ): void {
    const eventSubscribers = this.subscribers[eventName] as Set<
      LifecycleSubscriber<K>
    >;
    eventSubscribers.forEach((subscriber) => {
      subscriber(payload);
    });
  }

  /**
   * Removes all lifecycle subscribers.
   *
   * @returns {void}
   */
  public clear(): void {
    this.subscribers.turnEnd.clear();
    this.subscribers.roundEnd.clear();
    this.subscribers.roundStart.clear();
    this.subscribers.turnStart.clear();
  }
}
