/**
 * @fileoverview Draggable Container — Generic Moveable & Resizable Wrapper
 *
 * @module ui/draggable/Draggable
 */

'use client';

import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import styles from './draggable.module.scss';

/** @constant {number} MIN_WIDTH - Minimum resize width in pixels */
const MIN_WIDTH = 200;

/** @constant {number} MIN_HEIGHT - Minimum resize height in pixels */
const MIN_HEIGHT = 120;

/**
 * Position value as a simple coordinate pair.
 *
 * @interface PositionValue
 * @property {number} x - Horizontal offset in pixels
 * @property {number} y - Vertical offset in pixels
 */
interface PositionValue {
  x: number;
  y: number;
}

/**
 * Function that computes initial position from the bounding container dimensions.
 * Called after mount when the parent element is measurable.
 *
 * @callback PositionFromBounds
 * @param {{ width: number; height: number }} parentBounds - Parent container dimensions
 * @returns {PositionValue} Computed initial position
 */
type PositionFromBounds = (parentBounds: {
  width: number;
  height: number;
}) => PositionValue;

/**
 * Props for the Draggable component.
 *
 * @interface DraggableProps
 * @property {ReactNode} children - Content rendered inside the draggable container
 * @property {string} [handleLabel] - Optional text label shown in the drag handle bar
 * @property {string} [className] - Additional CSS class for the outer container
 * @property {CSSProperties} [style] - Additional inline styles for the outer container
 * @property {CSSProperties['width']} [defaultWidth] - Default width in CSS syntax; overridden by user resize
 * @property {CSSProperties['height']} [defaultHeight] - Default height in CSS syntax; overridden by user resize
 * @property {PositionValue | PositionFromBounds} [initialPosition] - Starting position; static coordinates or a function receiving parent bounds
 * @property {React.RefObject<HTMLElement | null>} [boundsRef] - Ref to the bounding container element
 * @property {string} [testId] - data-testid for testing
 * @property {boolean} [resizable] - Whether the container can be resized via a corner handle
 * @property {Function} [onClose] - Callback when the close button is clicked; shows close button when provided
 */
interface DraggableProps {
  children: ReactNode;
  handleLabel?: string;
  className?: string;
  style?: CSSProperties;
  defaultWidth?: CSSProperties['width'];
  defaultHeight?: CSSProperties['height'];
  initialPosition?: PositionValue | PositionFromBounds;
  boundsRef?: React.RefObject<HTMLElement | null>;
  testId?: string;
  resizable?: boolean;
  onClose?: () => void;
}

/**
 * Draggable container with pointer-event drag, optional resize, and bounds clamping.
 *
 * @param {DraggableProps} props - Component props
 * @returns {React.ReactElement} The draggable container
 *
 * @example
 * ```tsx
 * <Draggable handleLabel="Preview" initialPosition={{ x: 100, y: 50 }} resizable>
 *   <iframe src="/content?embed=true" />
 * </Draggable>
 * ```
 */
export function Draggable({
  children,
  handleLabel,
  className,
  style,
  defaultWidth,
  defaultHeight,
  initialPosition = { x: 0, y: 0 },
  boundsRef,
  testId,
  resizable = false,
  onClose,
}: DraggableProps): React.ReactElement {
  /** Resolve a static initial position; functions resolve to {0,0} until layout effect runs */
  const staticInitial: PositionValue =
    typeof initialPosition === 'function' ? { x: 0, y: 0 } : initialPosition;

  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(staticInitial);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posAtDragStart = useRef({ x: 0, y: 0 });

  /** Resize state */
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const [isResizing, setIsResizing] = useState(false);
  const resizeStart = useRef({ x: 0, y: 0 });
  const sizeAtResizeStart = useRef({ width: 0, height: 0 });

  /**
   * Clamp a position so the container stays within bounds.
   *
   * @param {number} x - Proposed left offset
   * @param {number} y - Proposed top offset
   * @returns {{ x: number; y: number }} Clamped position
   */
  const clampToBounds = useCallback(
    (x: number, y: number): { x: number; y: number } => {
      const container = containerRef.current;
      const bounds = boundsRef?.current ?? container?.parentElement;
      if (!container || !bounds) return { x, y };

      const cRect = container.getBoundingClientRect();
      const bRect = bounds.getBoundingClientRect();

      const maxX = bRect.width - cRect.width;
      const maxY = bRect.height - cRect.height;

      return {
        x: Math.max(0, Math.min(x, maxX)),
        y: Math.max(0, Math.min(y, maxY)),
      };
    },
    [boundsRef],
  );

  /**
   * Begin drag on pointer down over the handle.
   *
   * @param {React.PointerEvent} e - Pointer event from the drag handle
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      if (target.setPointerCapture) {
        target.setPointerCapture(e.pointerId);
      }
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      posAtDragStart.current = { ...position };
    },
    [position],
  );

  /**
   * Update position during drag.
   *
   * @param {React.PointerEvent} e - Pointer move event
   */
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const raw = {
        x: posAtDragStart.current.x + dx,
        y: posAtDragStart.current.y + dy,
      };
      setPosition(clampToBounds(raw.x, raw.y));
    },
    [isDragging, clampToBounds],
  );

  /**
   * End drag on pointer up.
   */
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Begin resize on pointer down over the resize handle.
   *
   * @param {React.PointerEvent} e - Pointer event from the resize handle
   */
  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;
      if (target.setPointerCapture) {
        target.setPointerCapture(e.pointerId);
      }
      setIsResizing(true);
      resizeStart.current = { x: e.clientX, y: e.clientY };
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        sizeAtResizeStart.current = { width: rect.width, height: rect.height };
      }
      if (size) {
        sizeAtResizeStart.current = { ...size };
      }
    },
    [size],
  );

  /**
   * Update size during resize.
   *
   * @param {React.PointerEvent} e - Pointer move event
   */
  const handleResizePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isResizing) return;
      const dx = e.clientX - resizeStart.current.x;
      const dy = e.clientY - resizeStart.current.y;
      setSize({
        width: Math.max(MIN_WIDTH, sizeAtResizeStart.current.width + dx),
        height: Math.max(MIN_HEIGHT, sizeAtResizeStart.current.height + dy),
      });
    },
    [isResizing],
  );

  /**
   * End resize on pointer up.
   */
  const handleResizePointerUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  /**
   * Compute position from parent bounds when initialPosition is a function.
   * Runs synchronously before paint to avoid a visible flash at {0,0}.
   */
  const positionInitialized = useRef(typeof initialPosition !== 'function');
  useLayoutEffect(() => {
    if (positionInitialized.current) return;
    positionInitialized.current = true;
    const bounds = boundsRef?.current ?? containerRef.current?.parentElement;
    const parentBounds = {
      width: bounds?.clientWidth ?? window.innerWidth,
      height: bounds?.clientHeight ?? window.innerHeight,
    };
    if (typeof initialPosition === 'function') {
      const pos = initialPosition(parentBounds);
      setPosition(clampToBounds(pos.x, pos.y));
    }
  }, [initialPosition, boundsRef, clampToBounds]);

  /** Re-clamp on window resize to prevent off-screen panels */
  useEffect(() => {
    const onResize = () => {
      setPosition((prev) => clampToBounds(prev.x, prev.y));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampToBounds]);

  const containerClass = [
    styles.draggable,
    isDragging ? styles.isDragging : '',
    isResizing ? styles.isResizing : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  /** Build inline styles with position, default dimensions, and resize overrides */
  const containerStyle: CSSProperties = {
    left: position.x,
    top: position.y,
    ...(defaultWidth != null ? { width: defaultWidth } : {}),
    ...(defaultHeight != null ? { height: defaultHeight } : {}),
    ...style,
    /** User resize overrides default dimensions and style */
    ...(size ? { width: size.width, height: size.height } : {}),
  };

  return (
    <div
      ref={containerRef}
      className={containerClass}
      style={containerStyle}
      data-testid={testId}>
      <div
        className={styles.dragHandle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        role='separator'
        aria-orientation='horizontal'
        aria-label={handleLabel ?? 'Drag handle'}>
        <span className={styles.dragGrip} aria-hidden='true' />
        {handleLabel && <span className={styles.dragLabel}>{handleLabel}</span>}
        {onClose && (
          <button
            className={styles.closeButton}
            onClick={onClose}
            type='button'
            aria-label='Close panel'>
            <X size={16} aria-hidden='true' />
          </button>
        )}
      </div>
      <div className={styles.dragContent}>{children}</div>
      {resizable && (
        <div
          className={styles.resizeHandle}
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          role='separator'
          aria-orientation='vertical'
          aria-label='Resize handle'
          data-testid={testId ? `${testId}-resize` : undefined}
        />
      )}
    </div>
  );
}
