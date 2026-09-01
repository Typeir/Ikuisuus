/**
 * @fileoverview Dropdown Panel Atom
 * @description ▾-triggered floating panel. Owns open/close state, click-outside
 * detection, and keyboard dismissal. Renders via
 * {@link https://react.dev/reference/react-dom/createPortal createPortal} at
 * `document.body`. Positioning derived from the trigger's bounding rect, applied
 * as a transform by {@link useAnchoredPosition}.
 * @module modules/character-builder/presentation/atoms/dropdownPanel
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

'use client';

import { ChevronDown } from 'lucide-react';
import {
  toAnchorName,
  useAnchoredPosition,
  useCssAnchorSupport,
} from '@/lib/hooks/useAnchoredPosition';
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';
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
 * @property {boolean} [disabled] - When true, the trigger is disabled and the panel cannot open
 * @property {React.ReactNode} children - Content rendered inside the floating panel
 */
export interface DropdownPanelProps {
  triggerLabel: string;
  badge?: React.ReactNode;
  triggerClassName?: string;
  panelClassName?: string;
  panelRole?: string;
  panelLabel?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

/**
 * ▾-triggered floating panel portaled to `document.body` when open and
 * positioned with `position: fixed`. Renders as a Fragment: badge node, then
 * trigger button, then panel.
 * @component
 * @param {DropdownPanelProps} props - Component props
 * @param {string} props.triggerLabel - Accessible `aria-label` for the ▾ trigger button
 * @param {React.ReactNode} [props.badge] - Optional node rendered as a sibling before the trigger (e.g. count badge, `+` indicator)
 * @param {string} [props.triggerClassName] - Class name applied to the ▾ button
 * @param {string} [props.panelClassName] - Class name applied to the floating panel container
 * @param {string} [props.panelRole='region'] - ARIA `role` for the panel container; defaults to `'region'`
 * @param {string} [props.panelLabel] - ARIA `aria-label` for the panel container
 * @param {React.ReactNode} props.children - Content rendered inside the floating panel
 * @returns {React.ReactElement} Badge + trigger fragment with portaled panel
 */
export const DropdownPanel: React.FC<DropdownPanelProps> = ({
  triggerLabel,
  badge,
  triggerClassName,
  panelClassName,
  panelRole = 'region',
  panelLabel,
  disabled = false,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const compute = useCallback((rect: DOMRect, panel: HTMLElement) => {
    const maxLeft = Math.max(8, window.innerWidth - panel.offsetWidth - 8);
    return {
      x: Math.min(Math.max(8, rect.left), maxLeft),
      y: rect.bottom + 4,
    };
  }, []);

  const cssAnchored = useCssAnchorSupport();
  const anchorName = toAnchorName(useId());

  useAnchoredPosition(triggerRef, panelRef, compute, {
    active: !cssAnchored && open && !disabled,
  });

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const panel =
    open &&
    !disabled &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={panelRef}
        className={panelClassName}
        role={panelRole}
        aria-label={panelLabel}
        style={
          {
            position: 'fixed',
            zIndex: 1100,
            ...(cssAnchored
              ? { positionAnchor: anchorName, positionArea: 'block-end span-inline-end', marginBlockStart: 4 }
              : { top: 0, left: 0, right: 'auto', willChange: 'transform' }),
          } as CSSProperties
        }>
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
        disabled={disabled}
        style={{ anchorName } as CSSProperties}
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
