/**
 * @fileoverview Draggable Behaviour
 * @description Pointer drag, corner resize and bounds clamping for any element,
 * separated from the container that renders them so a surface can adopt drag in
 * place rather than being replaced by a wrapper.
 *
 * @module lib/components/ui/draggable/useDrag
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';

/** Minimum resize width in pixels. */
export const MIN_WIDTH = 200;

/** Minimum resize height in pixels. */
export const MIN_HEIGHT = 120;

/** Pixels an arrow key moves or resizes by. */
export const KEY_STEP = 8;

/** Pixels an arrow key moves or resizes by with Shift held. */
export const KEY_STEP_COARSE = 32;

/** Arrow keys mapped to their unit vector. */
const ARROWS: Record<string, PositionValue> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

/**
 * Position value as a simple coordinate pair.
 *
 * @interface PositionValue
 * @property {number} x - Horizontal offset in pixels
 * @property {number} y - Vertical offset in pixels
 */
export interface PositionValue {
  x: number;
  y: number;
}

/**
 * Computes an initial position from the bounding container's dimensions.
 *
 * @callback PositionFromBounds
 * @param {{ width: number; height: number }} parentBounds - Parent dimensions
 * @returns {PositionValue} Computed initial position
 */
export type PositionFromBounds = (parentBounds: {
  width: number;
  height: number;
}) => PositionValue;

/**
 * Pointer handlers for a handle element.
 *
 * @interface HandleProps
 * @property {Function} onPointerDown - Starts the gesture
 * @property {Function} onPointerMove - Continues the gesture
 * @property {Function} onPointerUp - Ends the gesture
 * @property {Function} onKeyDown - Moves or resizes by arrow key
 * @property {number} tabIndex - Makes the handle reachable by tab
 */
export interface HandleProps {
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  onPointerUp: () => void;
  onKeyDown: (event: ReactKeyboardEvent) => void;
  tabIndex: number;
}

/**
 * Options for {@link useDrag}.
 *
 * @interface DragOptions
 * @property {RefObject<HTMLElement | null>} containerRef - The element being moved
 * @property {PositionValue | PositionFromBounds} [initialPosition] - Starting position; new static coordinates after mount move the element
 * @property {RefObject<HTMLElement | null>} [boundsRef] - Element to clamp within; defaults to the container's parent
 */
export interface DragOptions {
  containerRef: RefObject<HTMLElement | null>;
  initialPosition?: PositionValue | PositionFromBounds;
  boundsRef?: RefObject<HTMLElement | null>;
}

/**
 * Result of {@link useDrag}.
 *
 * @interface DragBehaviour
 * @property {PositionValue} position - Current offset within the bounds
 * @property {{ width: number; height: number } | null} size - User-set size, or null
 * @property {boolean} isDragging - Whether a drag is in progress
 * @property {boolean} isResizing - Whether a resize is in progress
 * @property {HandleProps} dragHandleProps - Spread onto the drag handle
 * @property {HandleProps} resizeHandleProps - Spread onto the resize handle
 */
export interface DragBehaviour {
  position: PositionValue;
  size: { width: number; height: number } | null;
  isDragging: boolean;
  isResizing: boolean;
  dragHandleProps: HandleProps;
  resizeHandleProps: HandleProps;
}

/**
 * Gives an element pointer drag, corner resize and bounds clamping.
 *
 * @param {DragOptions} options - Target element and positioning
 * @returns {DragBehaviour} Position, size and handle props
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * const { position, dragHandleProps } = useDrag({ containerRef: ref });
 * <div ref={ref} style={{ left: position.x, top: position.y }}>
 *   <span {...dragHandleProps} />
 * </div>
 * ```
 */
export function useDrag({
  containerRef,
  initialPosition = { x: 0, y: 0 },
  boundsRef,
}: DragOptions): DragBehaviour {
  const staticInitial: PositionValue =
    typeof initialPosition === 'function' ? { x: 0, y: 0 } : initialPosition;

  const [position, setPosition] = useState(staticInitial);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posAtDragStart = useRef({ x: 0, y: 0 });

  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const [isResizing, setIsResizing] = useState(false);
  const resizeStart = useRef({ x: 0, y: 0 });
  const sizeAtResizeStart = useRef({ width: 0, height: 0 });

  /**
   * Clamps a position so the element stays inside its bounds.
   *
   * @param {number} x - Proposed left offset
   * @param {number} y - Proposed top offset
   * @returns {PositionValue} Clamped position
   */
  const clampToBounds = useCallback(
    (x: number, y: number): PositionValue => {
      const container = containerRef.current;
      const bounds = boundsRef?.current ?? container?.parentElement;
      if (!container || !bounds) return { x, y };

      const cRect = container.getBoundingClientRect();
      const bRect = bounds.getBoundingClientRect();

      return {
        x: Math.max(0, Math.min(x, bRect.width - cRect.width)),
        y: Math.max(0, Math.min(y, bRect.height - cRect.height)),
      };
    },
    [boundsRef, containerRef],
  );

  const onDragPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      event.preventDefault();
      const target = event.target as HTMLElement;
      target.setPointerCapture?.(event.pointerId);
      setIsDragging(true);
      dragStart.current = { x: event.clientX, y: event.clientY };

      const container = containerRef.current;
      const bounds = boundsRef?.current ?? container?.parentElement;
      const rect = container?.getBoundingClientRect();
      const boundsRect = bounds?.getBoundingClientRect();

      posAtDragStart.current =
        rect && boundsRect
          ? { x: rect.left - boundsRect.left, y: rect.top - boundsRect.top }
          : { ...position };
    },
    [boundsRef, containerRef, position],
  );

  const onDragPointerMove = useCallback(
    (event: ReactPointerEvent) => {
      if (!isDragging) return;
      const dx = event.clientX - dragStart.current.x;
      const dy = event.clientY - dragStart.current.y;
      setPosition(
        clampToBounds(
          posAtDragStart.current.x + dx,
          posAtDragStart.current.y + dy,
        ),
      );
    },
    [isDragging, clampToBounds],
  );

  const onDragPointerUp = useCallback(() => setIsDragging(false), []);

  /**
   * Moves by arrow key, coarser with Shift. A `separator` handle is the ARIA
   * window-splitter pattern, which is expected to be keyboard operable.
   *
   * @param {ReactKeyboardEvent} event - Key event from the handle
   */
  const onDragKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      const arrow = ARROWS[event.key];
      if (!arrow) return;

      event.preventDefault();
      const step = event.shiftKey ? KEY_STEP_COARSE : KEY_STEP;
      setPosition((prev) =>
        clampToBounds(prev.x + arrow.x * step, prev.y + arrow.y * step),
      );
    },
    [clampToBounds],
  );

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const target = event.target as HTMLElement;
      target.setPointerCapture?.(event.pointerId);
      setIsResizing(true);
      resizeStart.current = { x: event.clientX, y: event.clientY };

      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        sizeAtResizeStart.current = { width: rect.width, height: rect.height };
      }
      if (size) sizeAtResizeStart.current = { ...size };
    },
    [containerRef, size],
  );

  const onResizePointerMove = useCallback(
    (event: ReactPointerEvent) => {
      if (!isResizing) return;
      const dx = event.clientX - resizeStart.current.x;
      const dy = event.clientY - resizeStart.current.y;
      setSize({
        width: Math.max(MIN_WIDTH, sizeAtResizeStart.current.width + dx),
        height: Math.max(MIN_HEIGHT, sizeAtResizeStart.current.height + dy),
      });
    },
    [isResizing],
  );

  const onResizePointerUp = useCallback(() => setIsResizing(false), []);

  /**
   * Resizes by arrow key, coarser with Shift.
   *
   * @param {ReactKeyboardEvent} event - Key event from the corner
   */
  const onResizeKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      const arrow = ARROWS[event.key];
      if (!arrow) return;

      event.preventDefault();
      const step = event.shiftKey ? KEY_STEP_COARSE : KEY_STEP;
      const rect = containerRef.current?.getBoundingClientRect();
      const base = size ?? {
        width: rect?.width ?? MIN_WIDTH,
        height: rect?.height ?? MIN_HEIGHT,
      };

      setSize({
        width: Math.max(MIN_WIDTH, base.width + arrow.x * step),
        height: Math.max(MIN_HEIGHT, base.height + arrow.y * step),
      });
    },
    [containerRef, size],
  );

  /** Resolves a positioning function once the parent is measurable. */
  const positionInitialized = useRef(typeof initialPosition !== 'function');
  useLayoutEffect(() => {
    if (positionInitialized.current) return;
    positionInitialized.current = true;

    const bounds = boundsRef?.current ?? containerRef.current?.parentElement;
    if (typeof initialPosition === 'function') {
      const pos = initialPosition({
        width: bounds?.clientWidth ?? window.innerWidth,
        height: bounds?.clientHeight ?? window.innerHeight,
      });
      setPosition(clampToBounds(pos.x, pos.y));
    }
  }, [initialPosition, boundsRef, clampToBounds, containerRef]);

  /**
   * Moves the element when static coordinates change after mount. Compared by
   * value, since an inline literal is a new reference every render.
   */
  const appliedInitial = useRef<PositionValue | null>(
    typeof initialPosition === 'function' ? null : staticInitial,
  );
  useLayoutEffect(() => {
    if (typeof initialPosition === 'function') return;

    const applied = appliedInitial.current;
    if (
      applied &&
      applied.x === initialPosition.x &&
      applied.y === initialPosition.y
    ) {
      return;
    }

    appliedInitial.current = { x: initialPosition.x, y: initialPosition.y };
    setPosition(clampToBounds(initialPosition.x, initialPosition.y));
  }, [initialPosition, clampToBounds]);

  /** Re-clamp on window resize so the element cannot strand off-screen. */
  useEffect(() => {
    const onResize = () => setPosition((prev) => clampToBounds(prev.x, prev.y));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampToBounds]);

  return {
    position,
    size,
    isDragging,
    isResizing,
    dragHandleProps: {
      onPointerDown: onDragPointerDown,
      onPointerMove: onDragPointerMove,
      onPointerUp: onDragPointerUp,
      onKeyDown: onDragKeyDown,
      tabIndex: 0,
    },
    resizeHandleProps: {
      onPointerDown: onResizePointerDown,
      onPointerMove: onResizePointerMove,
      onPointerUp: onResizePointerUp,
      onKeyDown: onResizeKeyDown,
      tabIndex: 0,
    },
  };
}
