/**
 * @fileoverview Aspect pill: icon mark plus label, rendered as link, button, span or removable chip.
 *
 * @module modules/library/presentation/components/Aspects/AspectPill
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-04
 */

'use client';

import {
  aspectColour,
  aspectMark,
  type ParsedAspect,
} from '@/modules/library/domain/aspects';
import { IconButton } from '@/lib/components/ui/iconButton';
import React from 'react';
import styles from './Aspects.module.scss';

/**
 * Position of each member of a damage stratum around the mark.
 */
const STRATUM_SLOTS = ['top', 'left', 'right'] as const;

/**
 * Pill/glyph size step. `m` is the baseline; `s` shrinks the badge ~30% and
 * the mark ~20%, `l` grows them by the same ratios.
 */
export type AspectSize = 's' | 'm' | 'l';

/**
 * Aspect pill: icon mark plus label. Link by default, button with onSelect.
 *
 * @param {object} props - Component properties
 * @param {ParsedAspect} props.aspect - The aspect to render
 * @param {string} props.locale - Active locale, for search link
 * @param {boolean} [props.compact] - Glyph-only rendering
 * @param {(aspect: ParsedAspect) => void} [props.onSelect] - Button click handler
 * @param {boolean} [props.inert] - Plain span for cells in link/button
 * @param {boolean} [props.pressed] - Button aria-pressed state
 * @param {boolean} [props.disabled] - Button disabled state
 * @param {(aspect: ParsedAspect) => void} [props.onRemove] - Renders the chip remove button inside the pill
 * @param {string} [props.removeLabel] - Accessible label for the remove button
 * @param {AspectSize} [props.size] - Size step; defaults to `m`
 * @returns {React.ReactElement} The pill
 */
export const AspectPill: React.FC<{
  aspect: ParsedAspect;
  locale: string;
  compact?: boolean;
  onSelect?: (aspect: ParsedAspect) => void;
  pressed?: boolean;
  disabled?: boolean;
  inert?: boolean;
  onRemove?: (aspect: ParsedAspect) => void;
  removeLabel?: string;
  size?: AspectSize;
}> = ({
  aspect,
  locale,
  compact,
  onSelect,
  pressed,
  disabled,
  inert,
  onRemove,
  removeLabel,
  size,
}) => {
  const { Icon, Badge, badgeVar, strata } = aspectMark(aspect);
  const name = `${aspect.group}: ${aspect.value}`;

  const body = (
    <>
      <span
        className={strata ? `${styles.mark} ${styles.markStrata}` : styles.mark}
        aria-hidden='true'
      >
        <Icon className={styles.icon} />
        {strata?.map((member, index) => (
          <span
            key={member.value}
            className={styles.stratum}
            data-slot={STRATUM_SLOTS[index]}
            style={
              { '--badge-fg': `var(${member.colourVar})` } as React.CSSProperties
            }
          >
            <member.Icon className={styles.icon} />
          </span>
        ))}
        {Badge ? (
          <span
            className={styles.badge}
            style={
              badgeVar
                ? ({ '--badge-fg': `var(${badgeVar})` } as React.CSSProperties)
                : undefined
            }
          >
            <Badge className={styles.icon} />
          </span>
        ) : null}
      </span>
      {compact ? null : (
        <span className={styles.label}>
          <span className={styles.group}>{aspect.group}</span>
          <span className={styles.separator}>:</span>
          <span className={styles.value}>{aspect.value}</span>
        </span>
      )}
    </>
  );

  const shared = {
    className: compact ? styles.glyph : styles.aspect,
    'aria-label': name,
    title: name,
    'data-group': aspect.group,
    'data-size': size && size !== 'm' ? size : undefined,
    style: { '--aspect-fg': aspectColour(aspect) } as React.CSSProperties,
  };

  if (inert) {
    return <span {...shared}>{body}</span>;
  }

  /* The remove control is a button, so the pill around it cannot be one too:
     a nested button is closed by the HTML parser and the pill loses its
     contents on hydration. */
  if (onRemove) {
    return (
      <span {...shared} className={`${shared.className} ${styles.removable}`}>
        {body}
        <IconButton
          kind='close'
          size='xs'
          tone='inherit'
          label={removeLabel ?? `Remove ${name}`}
          onClick={() => onRemove(aspect)}
        />
      </span>
    );
  }

  if (onSelect || disabled) {
    return (
      <button
        type='button'
        {...shared}
        aria-pressed={pressed}
        disabled={disabled}
        onClick={onSelect ? () => onSelect(aspect) : undefined}
      >
        {body}
      </button>
    );
  }

  return (
    <a
      {...shared}
      href={`/${locale}/search?aspect=${encodeURIComponent(aspect.raw)}`}
    >
      {body}
    </a>
  );
};
