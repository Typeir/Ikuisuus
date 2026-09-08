/**
 * @fileoverview Tooltip Visibility State Machine
 * @description Open/close lifecycle for hover surfaces
 *
 * @module lib/components/ui/tooltip/useTooltipVisibility
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { TOOLTIP_HIDE_DELAY_MS } from '@/lib/constants/delays';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Duration of the CSS exit transition.
 *
 * @constant
 */
export const TOOLTIP_EXIT_DURATION = 150;

/**
 * Options for {@link useTooltipVisibility}.
 *
 * @interface TooltipVisibilityOptions
 * @property {number} [showDelay] - Delay before opening, in ms
 * @property {number} [hideDelay=TOOLTIP_HIDE_DELAY_MS] - Grace period before the exit phase begins, in ms
 * @property {number} [exitDuration] - Length of the exit phase, in ms
 * @property {boolean} [disabled] - When true, `show` is inert
 */
export interface TooltipVisibilityOptions {
  showDelay?: number;
  hideDelay?: number;
  exitDuration?: number;
  disabled?: boolean;
}

/**
 * Controls returned by {@link useTooltipVisibility}.
 *
 * @interface TooltipVisibility
 * @property {boolean} isVisible - Whether the surface is open
 * @property {boolean} exiting - Whether the surface is playing its exit transition
 * @property {boolean} showPortal - Whether the surface should be mounted
 * @property {() => void} show - Opens after `showDelay`, cancelling any exit
 * @property {() => void} hide - Starts the exit phase after `hideDelay`
 * @property {() => void} showNow - Opens on this tick
 * @property {() => void} hideNow - Closes on this tick, skipping the exit phase
 */
export interface TooltipVisibility {
  isVisible: boolean;
  exiting: boolean;
  showPortal: boolean;
  show: () => void;
  hide: () => void;
  showNow: () => void;
  hideNow: () => void;
}

/**
 * Drives a hover surface's open/close lifecycle.
 *
 * @param {TooltipVisibilityOptions} [options] - Timing and disabled state
 * @returns {TooltipVisibility} Visibility flags and imperative controls
 *
 * @example
 * ```tsx
 * const { showPortal, show, hide } = useTooltipVisibility({ showDelay: 200 });
 * <span onMouseEnter={show} onMouseLeave={hide} />
 * ```
 */
export function useTooltipVisibility({
  showDelay = 200,
  hideDelay = TOOLTIP_HIDE_DELAY_MS,
  exitDuration = TOOLTIP_EXIT_DURATION,
  disabled = false,
}: TooltipVisibilityOptions = {}): TooltipVisibility {
  const [isVisible, setIsVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const showTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const exitingRef = useRef(false);

  const cancelExit = useCallback(() => {
    clearTimeout(exitTimer.current);
    setExiting(false);
    exitingRef.current = false;
  }, []);

  const show = useCallback(() => {
    if (disabled) return;

    clearTimeout(hideTimer.current);
    if (exitingRef.current) {
      cancelExit();
      return;
    }
    showTimer.current = setTimeout(() => setIsVisible(true), showDelay);
  }, [cancelExit, disabled, showDelay]);

  const showNow = useCallback(() => {
    if (disabled) return;

    clearTimeout(showTimer.current);
    clearTimeout(hideTimer.current);
    cancelExit();
    setIsVisible(true);
  }, [cancelExit, disabled]);

  const hide = useCallback(() => {
    clearTimeout(showTimer.current);
    hideTimer.current = setTimeout(() => {
      setExiting(true);
      exitingRef.current = true;
    }, hideDelay);
  }, [hideDelay]);

  const hideNow = useCallback(() => {
    clearTimeout(showTimer.current);
    clearTimeout(hideTimer.current);
    cancelExit();
    setIsVisible(false);
  }, [cancelExit]);

  useEffect(() => {
    if (!exiting) return;

    exitTimer.current = setTimeout(() => {
      setIsVisible(false);
      setExiting(false);
      exitingRef.current = false;
    }, exitDuration);

    return () => clearTimeout(exitTimer.current);
  }, [exiting, exitDuration]);

  useEffect(
    () => () => {
      clearTimeout(showTimer.current);
      clearTimeout(hideTimer.current);
      clearTimeout(exitTimer.current);
    },
    [],
  );

  return {
    isVisible,
    exiting,
    showPortal: isVisible || exiting,
    show,
    hide,
    showNow,
    hideNow,
  };
}
