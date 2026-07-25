/**
 * @fileoverview Resizable Pane Component
 * @description Two-pane horizontal split with a draggable vertical handle.
 * The left pane's width is expressed as a percentage of the total wrapper
 * width and persisted to `localStorage` under the consumer-provided `id`.
 * Stacks vertically below 900px to match existing tab breakpoints.
 *
 * Keyboard support on the handle:
 *  - ArrowLeft / ArrowRight: shift left pane by ±2%
 *  - Home / End: jump to `minLeftPercent` / `maxLeftPercent`
 *
 * @module ui/resizablePane
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import { DragBar } from '@/lib/components/ui/dragBar/dragBar';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import styles from './resizablePane.module.scss';

/**
 * Props for the ResizablePane component.
 *
 * @interface ResizablePaneProps
 * @property {string} id - Unique identifier used as the localStorage key suffix
 * @property {ReactNode} left - Content of the left pane
 * @property {ReactNode} right - Content of the right pane
 * @property {number} [defaultLeftPercent] - Initial left pane width as a percentage of the wrapper (default 30)
 * @property {number} [minLeftPercent] - Minimum left pane width percentage (default 18)
 * @property {number} [maxLeftPercent] - Maximum left pane width percentage (default 70)
 * @property {string} [ariaLabel] - Optional aria-label for the wrapper group
 * @property {string} [className] - Optional extra class for the wrapper
 */
export interface ResizablePaneProps {
  id: string;
  left: ReactNode;
  right: ReactNode;
  defaultLeftPercent?: number;
  minLeftPercent?: number;
  maxLeftPercent?: number;
  ariaLabel?: string;
  className?: string;
}

/**
 * Storage key prefix for persisting per-pane widths.
 */
const STORAGE_PREFIX = 'ikuisuus.resizablePane.';

/**
 * Clamp a numeric value into the inclusive range `[min, max]`.
 *
 * @function clamp
 * @param {number} value - Source value
 * @param {number} min - Lower bound
 * @param {number} max - Upper bound
 * @returns {number} Clamped value
 */
function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Read a persisted percentage from localStorage. Returns null when the value
 * is missing, malformed, or out of range.
 *
 * @function readStoredPercent
 * @param {string} key - Storage key
 * @param {number} min - Lower bound for validation
 * @param {number} max - Upper bound for validation
 * @returns {number | null} Parsed percentage or null
 */
function readStoredPercent(
  key: string,
  min: number,
  max: number,
): number | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) return null;
    if (parsed < min || parsed > max) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Persist a percentage to localStorage. Failures are swallowed (e.g. quota,
 * privacy mode).
 *
 * @function writeStoredPercent
 * @param {string} key - Storage key
 * @param {number} value - Percentage to store
 */
function writeStoredPercent(key: string, value: number): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, String(value));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

/**
 * Two-pane horizontal split with a draggable, keyboard-accessible handle.
 *
 * @component
 * @param {ResizablePaneProps} props - Component props
 * @param {string} props.id - Unique identifier used as the localStorage key suffix
 * @param {ReactNode} props.left - Content of the left pane
 * @param {ReactNode} props.right - Content of the right pane
 * @param {number} [props.defaultLeftPercent=30] - Initial left pane width as a percentage of the wrapper (default 30)
 * @param {number} [props.minLeftPercent=18] - Minimum left pane width percentage (default 18)
 * @param {number} [props.maxLeftPercent=70] - Maximum left pane width percentage (default 70)
 * @param {string} [props.ariaLabel] - Optional aria-label for the wrapper group
 * @param {string} [props.className] - Optional extra class for the wrapper
 * @returns {JSX.Element} Rendered split layout
 */
export const ResizablePane: React.FC<ResizablePaneProps> = ({
  id,
  left,
  right,
  defaultLeftPercent = 30,
  minLeftPercent = 18,
  maxLeftPercent = 70,
  ariaLabel,
  className,
}) => {
  const storageKey = `${STORAGE_PREFIX}${id}`;
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const [leftPercent, setLeftPercent] = useState<number>(() => {
    return clamp(defaultLeftPercent, minLeftPercent, maxLeftPercent);
  });

  useEffect(() => {
    const stored = readStoredPercent(
      storageKey,
      minLeftPercent,
      maxLeftPercent,
    );
    if (stored !== null) {
      setLeftPercent(stored);
    }
  }, [storageKey, minLeftPercent, maxLeftPercent]);

  const commitPercent = useCallback(
    (next: number, persist: boolean) => {
      const clamped = clamp(next, minLeftPercent, maxLeftPercent);
      setLeftPercent(clamped);
      if (persist) {
        writeStoredPercent(storageKey, clamped);
      }
    },
    [storageKey, minLeftPercent, maxLeftPercent],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || !wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pct = ((event.clientX - rect.left) / rect.width) * 100;
      commitPercent(pct, false);
    },
    [commitPercent],
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      draggingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore — pointer may already be released */
      }
      writeStoredPercent(storageKey, leftPercent);
    },
    [storageKey, leftPercent],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const step = 2;
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          commitPercent(leftPercent - step, true);
          break;
        case 'ArrowRight':
          event.preventDefault();
          commitPercent(leftPercent + step, true);
          break;
        case 'Home':
          event.preventDefault();
          commitPercent(minLeftPercent, true);
          break;
        case 'End':
          event.preventDefault();
          commitPercent(maxLeftPercent, true);
          break;
        default:
          break;
      }
    },
    [leftPercent, commitPercent, minLeftPercent, maxLeftPercent],
  );

  const wrapperStyle: CSSProperties = {
    ['--resizable-left-pct' as string]: `${leftPercent}%`,
  };

  const wrapperClass = [styles.resizablePane, className]
    .filter(Boolean)
    .join(' ');

  const valueNow = Math.round(leftPercent);

  return (
    <div
      ref={wrapperRef}
      className={wrapperClass}
      style={wrapperStyle}
      role='group'
      aria-label={ariaLabel}
      data-pane-id={id}>
      <div className={styles.leftPane}>{left}</div>
      <DragBar
        valueNow={valueNow}
        valueMin={Math.round(minLeftPercent)}
        valueMax={Math.round(maxLeftPercent)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
      />
      <div className={styles.rightPane}>{right}</div>
    </div>
  );
};

export default ResizablePane;
