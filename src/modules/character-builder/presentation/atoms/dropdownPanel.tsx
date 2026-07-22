/**
 * @fileoverview Dropdown Panel Atom
 * @description Reusable behavioral atom for any ▾-triggered floating panel.
 * Owns open/close state, click-outside detection, and keyboard dismissal.
 * Uses {@link https://react.dev/reference/react-dom/createPortal createPortal}
 * to render the panel at `document.body` level, escaping all parent stacking
 * contexts and eliminating z-index collisions.
 *
 * Consumers are responsible for all visual styling — pass class names via
 * `triggerClassName` and `panelClassName`. Positioning is computed from the
 * trigger button's bounding rect and applied as inline fixed coordinates.
 *
 * @module lib/components/characterSheet/atoms/dropdownPanel
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

'use client';

import { ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Props for the DropdownPanel atom.
 *
 * @interface DropdownPanelProps
 * @property {string} triggerLabel - Accessible `aria-label` for the ▾ trigger button
 * @property {React.ReactNode} [badge] - Optional node rendered as a sibling before the trigger (e.g. count badge, `+` indicator)
 * @property {string} [triggerClassName] - Class name applied to the ▾ button
 * @property {string} [panelClassName] - Class name applied to the floating panel container
 * @property {string} [panelRole] - ARIA `role` for the panel container; defaults to `'region'`
 * @property {string} [panelLabel] - ARIA `aria-label` for the panel container
 * @property {React.ReactNode} children - Content rendered inside the floating panel
 */
export interface DropdownPanelProps {
  triggerLabel: string;
  badge?: React.ReactNode;
  triggerClassName?: string;
  panelClassName?: string;
  panelRole?: string;
  panelLabel?: string;
  children: React.ReactNode;
}

/**
 * Coordinates for the portaled panel, derived from the trigger's bounding rect.
 *
 * @interface PanelCoords
 * @property {number} top - Fixed `top` value in px (below the trigger)
 * @property {number} left - Fixed `left` value in px (aligned to trigger left)
 */
interface PanelCoords {
  top: number;
  left: number;
}

/**
 * Behavioral atom for a ▾-triggered floating panel.
 *
 * Renders as a React Fragment: optional badge node, then the trigger button.
 * The panel is portaled to `document.body` when open, positioned with
 * `position: fixed` so it always renders above any parent stacking context.
 *
 * @component
 * @param {DropdownPanelProps} props - Component props
 * @returns {React.ReactElement} Badge + trigger fragment with portaled panel
 */
export const DropdownPanel: React.FC<DropdownPanelProps> = ({
  triggerLabel,
  badge,
  triggerClassName,
  panelClassName,
  panelRole = 'region',
  panelLabel,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<PanelCoords>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 4, left: rect.left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateCoords();
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    const handleReposition = () => updateCoords();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [open, updateCoords]);

  const panel =
    open &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={panelRef}
        className={panelClassName}
        role={panelRole}
        aria-label={panelLabel}
        style={{
          position: 'fixed',
          top: coords.top,
          left: coords.left,
          right: 'auto',
          zIndex: 1100,
        }}>
        {children}
      </div>,
      document.body,
    );

  return (
    <>
      {badge}
      <button
        ref={triggerRef}
        type='button'
        className={triggerClassName}
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-haspopup='true'
        onClick={() => setOpen((v) => !v)}>
        <ChevronDown
          size={14}
          aria-hidden='true'
          style={{
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : undefined,
          }}
        />
      </button>
      {panel}
    </>
  );
};
