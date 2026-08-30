/**
 * @fileoverview IconButton atom — the one close / delete / add control.
 * @description Owns the glyph, its size and weight, the hover glow and the
 * permitted shapes. Icon-only it is a plain glyph, a bordered square or a
 * bordered rhombus; with children it becomes the square labelled control
 * (border, text, glyph on either side). Five sizes; the tone is the kind's
 * unless the call site inherits it from `--icon-btn-tone` on an ancestor.
 *
 * @module lib/components/ui/iconButton/IconButton
 * @version 1.3.0
 * @author Typeir
 * @since 3.1.0
 */

'use client';

import { cn } from '@/lib/utils/classNameMerge';
import { Plus, Trash2, X } from 'lucide-react';
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import styles from './iconButton.module.scss';

/**
 * Glyph and default tone. `close` and `delete` glow danger, `add` glows accent.
 *
 * @typedef {'close'|'delete'|'add'} IconButtonKind
 */
export type IconButtonKind = 'close' | 'delete' | 'add';

/**
 * Icon-only box. `plain` is the bare glyph; `square` and `rhombus` add the
 * 1px border and surface fill.
 *
 * @typedef {'plain'|'square'|'rhombus'} IconButtonShape
 */
export type IconButtonShape = 'plain' | 'square' | 'rhombus';

/**
 * Glyph scale. `m` is the default 16px glyph in a 24px box.
 *
 * @typedef {'xs'|'s'|'m'|'l'|'xl'} IconButtonSize
 */
export type IconButtonSize = 'xs' | 's' | 'm' | 'l' | 'xl';

/**
 * Hover/focus colour. `inherit` reads `--icon-btn-tone` from an ancestor —
 * for pills and toasts that carry their own hue.
 *
 * @typedef {'danger'|'accent'|'inherit'} IconButtonTone
 */
export type IconButtonTone = 'danger' | 'accent' | 'inherit';

/**
 * Side of the label the glyph sits on. Labelled form only.
 *
 * @typedef {'left'|'right'} IconButtonGlyphSide
 */
export type IconButtonGlyphSide = 'left' | 'right';

const GLYPHS: Record<IconButtonKind, typeof X> = {
  close: X,
  delete: Trash2,
  add: Plus,
};

const DEFAULT_TONE: Record<IconButtonKind, IconButtonTone> = {
  close: 'danger',
  delete: 'danger',
  add: 'accent',
};

const TONES: Record<IconButtonTone, string> = {
  danger: styles.danger,
  accent: styles.accent,
  inherit: styles.inherit,
};

const SHAPES: Record<IconButtonShape, string> = {
  plain: '',
  square: styles.square,
  rhombus: styles.rhombus,
};

/**
 * Lucide glyph px per size, with the stroke thickened where the 24-unit grid
 * would render it under 1.5px. Box and rhombus sides live in the stylesheet.
 */
const GLYPH: Record<IconButtonSize, { size: number; stroke: number }> = {
  xs: { size: 10, stroke: 3 },
  s: { size: 12, stroke: 3 },
  m: { size: 16, stroke: 2.5 },
  l: { size: 20, stroke: 2.5 },
  xl: { size: 24, stroke: 2.25 },
};

const SIZES: Record<IconButtonSize, string> = {
  xs: styles.xs,
  s: styles.s,
  m: styles.m,
  l: styles.l,
  xl: styles.xl,
};

/**
 * Native button attributes the atom lets through: ARIA state and
 * relationships, identity, focus order and focus/pointer events. Presentation
 * attributes (`className`, `style`) are deliberately excluded.
 *
 * @typedef {object} IconButtonPassthrough
 */
type IconButtonPassthrough = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | 'id'
  | 'tabIndex'
  | 'autoFocus'
  | 'form'
  | 'aria-expanded'
  | 'aria-controls'
  | 'aria-describedby'
  | 'aria-labelledby'
  | 'aria-pressed'
  | 'aria-haspopup'
  | 'aria-current'
  | 'onKeyDown'
  | 'onFocus'
  | 'onBlur'
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'onPointerDown'
>;

/**
 * Props shared by both forms.
 *
 * @interface IconButtonBaseProps
 * @property {IconButtonKind} kind - Glyph and default tone
 * @property {() => void} onClick - Activation handler
 * @property {IconButtonSize} [size] - Glyph scale (default `m`)
 * @property {IconButtonTone} [tone] - Hover colour; defaults from `kind`
 * @property {boolean} [disabled] - Disabled state
 * @property {boolean} [stopPropagation] - Swallow the click so a clickable parent row stays put
 * @property {string} [title] - HTML title tooltip
 * @property {string} [className] - Layout-only class from the call site (position, margin)
 */
interface IconButtonBaseProps extends IconButtonPassthrough {
  kind: IconButtonKind;
  onClick: () => void;
  size?: IconButtonSize;
  tone?: IconButtonTone;
  disabled?: boolean;
  stopPropagation?: boolean;
  title?: string;
  className?: string;
}

/**
 * Icon-only form. The glyph is the whole control, so an accessible name is required.
 *
 * @interface IconOnlyProps
 * @property {string} label - Accessible name
 * @property {IconButtonShape} [shape] - Box shape (default `plain`)
 */
interface IconOnlyProps extends IconButtonBaseProps {
  label: string;
  shape?: IconButtonShape;
  children?: never;
  glyph?: never;
}

/**
 * Labelled form. Square bordered control with visible text; the text names it.
 *
 * @interface LabelledProps
 * @property {ReactNode} children - Visible label
 * @property {IconButtonGlyphSide} [glyph] - Which side of the label the glyph sits on (default `left`)
 * @property {string} [label] - Accessible name when the children are not plain text
 */
interface LabelledProps extends IconButtonBaseProps {
  children: ReactNode;
  glyph?: IconButtonGlyphSide;
  label?: string;
  /** `rhombus` swaps the square chrome for a ghost label with the glyph in a diamond. */
  shape?: 'plain' | 'rhombus';
}

/**
 * Props for `<IconButton>`: icon-only or labelled, never both.
 *
 * @typedef {IconOnlyProps | LabelledProps} IconButtonProps
 */
export type IconButtonProps = IconOnlyProps | LabelledProps;

/**
 * Icon button with a fixed glyph. Icon-only: plain, square or rhombus. With
 * children: square labelled control, glyph left or right of the text.
 *
 * @component
 * @param {IconButtonProps} props - Component props
 * @param {IconButtonKind} props.kind - Glyph and default tone
 * @param {() => void} props.onClick - Activation handler
 * @param {string} [props.label] - Accessible name; required without children
 * @param {ReactNode} [props.children] - Visible label; switches to the labelled form
 * @param {IconButtonShape} [props.shape='plain'] - Box shape, icon-only form only
 * @param {IconButtonSize} [props.size='m'] - Glyph scale
 * @param {IconButtonTone} [props.tone] - Hover colour; defaults from `kind`
 * @param {IconButtonGlyphSide} [props.glyph='left'] - Glyph side, labelled form only
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {boolean} [props.stopPropagation=false] - Swallow the click
 * @param {string} [props.title] - HTML title tooltip
 * @param {string} [props.className] - Layout-only class
 * @param {React.Ref<HTMLButtonElement>} ref - Forwarded to the `<button>`
 * @returns {JSX.Element} Rendered button
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(props, ref) {
    const {
      kind,
      onClick,
      label,
      children,
      shape,
      glyph,
      size = 'm',
      tone,
      disabled = false,
      stopPropagation = false,
      title,
      className,
      ...passthrough
    } = props;
    const labelled = children !== undefined && children !== null;
    const boxShape: IconButtonShape = labelled ? 'plain' : (shape ?? 'plain');
    const glyphDiamond = labelled && shape === 'rhombus';
    const glyphRight = labelled && glyph === 'right';
    const Glyph = GLYPHS[kind];
    const glyphSpec = GLYPH[size];
    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      if (stopPropagation) e.stopPropagation();
      onClick();
    };
    const classes = cn(
      styles.btn,
      TONES[tone ?? DEFAULT_TONE[kind]],
      SIZES[size],
      SHAPES[boxShape],
      labelled && styles.labelled,
      glyphDiamond && styles.labelledRhombus,
      glyphRight && styles.glyphRight,
      className,
    );
    const glyphNode = (
      <Glyph
        size={glyphSpec.size}
        strokeWidth={glyphSpec.stroke}
        aria-hidden='true'
        focusable='false'
      />
    );

    return (
      <button
        {...passthrough}
        ref={ref}
        type='button'
        className={classes}
        onClick={handleClick}
        disabled={disabled}
        aria-label={label}
        title={title}
        data-kind={kind}
        data-size={size}>
        {glyphDiamond ? (
          <span className={styles.glyphDiamond} aria-hidden='true'>
            {glyphNode}
          </span>
        ) : (
          glyphNode
        )}
        {children}
      </button>
    );
  },
);
