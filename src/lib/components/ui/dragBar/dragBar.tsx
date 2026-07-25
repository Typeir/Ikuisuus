/**
 * @fileoverview Drag Bar Atom
 * @description Thin vertical drag handle for resizable split panes.
 * Keyboard-accessible (ArrowLeft/Right, Home/End). Pure presentational —
 * all drag logic lives in the parent (`ResizablePane`).
 *
 * @module ui/dragBar
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import type { KeyboardEvent, PointerEvent } from 'react';
import styles from './dragBar.module.scss';

/**
 * Props for `<DragBar>`.
 *
 * @interface DragBarProps
 * @property {number} valueNow - Current left pane percentage for aria
 * @property {number} valueMin - Minimum left pane percentage
 * @property {number} valueMax - Maximum left pane percentage
 * @property {(e: PointerEvent<HTMLDivElement>) => void} onPointerDown - Drag start
 * @property {(e: PointerEvent<HTMLDivElement>) => void} onPointerMove - Drag move
 * @property {(e: PointerEvent<HTMLDivElement>) => void} onPointerUp - Drag end
 * @property {(e: KeyboardEvent<HTMLDivElement>) => void} onKeyDown - Keyboard resize
 */
export interface DragBarProps {
  valueNow: number;
  valueMin: number;
  valueMax: number;
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
}

/**
 * Thin draggable vertical bar. No drag logic — parent owns everything.
 *
 * @component
 * @param {DragBarProps} props - Component props
 * @param {number} props.valueNow - Current left pane percentage for aria
 * @param {number} props.valueMin - Minimum left pane percentage
 * @param {number} props.valueMax - Maximum left pane percentage
 * @param {(e: PointerEvent<HTMLDivElement>) => void} props.onPointerDown - Drag start
 * @param {(e: PointerEvent<HTMLDivElement>) => void} props.onPointerMove - Drag move
 * @param {(e: PointerEvent<HTMLDivElement>) => void} props.onPointerUp - Drag end
 * @param {(e: KeyboardEvent<HTMLDivElement>) => void} props.onKeyDown - Keyboard resize
 * @returns {JSX.Element} Rendered drag handle
 */
export const DragBar: React.FC<DragBarProps> = ({
  valueNow,
  valueMin,
  valueMax,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyDown,
}) => (
  <div
    className={styles.dragBar}
    role='separator'
    tabIndex={0}
    aria-orientation='vertical'
    aria-valuenow={valueNow}
    aria-valuemin={valueMin}
    aria-valuemax={valueMax}
    aria-label='Resize panes'
    onPointerDown={onPointerDown}
    onPointerMove={onPointerMove}
    onPointerUp={onPointerUp}
    onPointerCancel={onPointerUp}
    onKeyDown={onKeyDown}
  />
);

export default DragBar;
