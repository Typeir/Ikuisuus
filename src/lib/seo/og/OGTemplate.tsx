/**
 * @fileoverview OG image JSX template for satori.
 *
 * Renders a 1200×630 dark card using only satori-compatible inline styles (no
 * CSS classes or variables). Two-column layout: text 40%, entity image 820×820
 * overflowing the canvas, description as a faint watermark behind the image.
 * Uses only satori-supported React element syntax — no hooks, context, or
 * browser APIs.
 *
 * @module lib/seo/og/OGTemplate
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import type { OGCardData } from './data';
import { OG_HEIGHT, OG_TOKENS, OG_WIDTH } from './tokens';

/**
 * Props for the OGTemplate component.
 *
 * @interface OGTemplateProps
 * @property {OGCardData} data - Resolved card metadata
 * @property {string} [imageUrl] - Absolute URL to the entity image; omitted when not available
 * @property {string} [backgroundImageUrl] - Absolute URL to the full-bleed background image rendered at low opacity
 * @property {string} [description] - Short flavour text for the border-left block
 */
export interface OGTemplateProps {
  data: OGCardData;
  imageUrl?: string;
  backgroundImageUrl?: string;
  description?: string;
}

/**
 * Derives a human-readable type/rarity tag line from card data.
 *
 * Priority: `rarity + itemType` → `creatureType` → `school + level` → `level` → `subLabel`
 *
 * @param {OGCardData} data - Card metadata
 * @returns {string} Formatted tag line
 */
function buildTagLine(data: OGCardData): string {
  if (data.rarity && data.itemType) {
    return `${data.rarity} ${data.itemType}`;
  }
  if (data.rarity) return data.rarity;
  if (data.creatureType) return data.creatureType;
  if (data.school && data.level) return `${data.level} · ${data.school}`;
  if (data.level) return data.level;
  if (data.school) return data.school;
  if (data.subLabel) return data.subLabel;
  return '';
}

/**
 * Satori-compatible JSX card template for OG image generation.
 *
 * Plain function component with no hooks, event handlers, or browser globals.
 *
 * @param {OGTemplateProps} props - Template data and optional image URL
 * @returns {React.ReactElement} JSX element tree for satori
 */
export function OGTemplate({
  data,
  imageUrl,
  backgroundImageUrl,
  description,
}: OGTemplateProps): React.ReactElement {
  const tagLine = buildTagLine(data);
  const watermarkText =
    description && description.length > 203
      ? `${description.slice(0, 200)}…`
      : description;

  return (
    <div
      style={{
        display: 'flex',
        width: OG_WIDTH,
        height: OG_HEIGHT,
        backgroundColor: OG_TOKENS.bg,
        fontFamily: '"Inter", sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}>
      {/* Full-bleed background image at low opacity */}
      {backgroundImageUrl ? (
        <img
          src={backgroundImageUrl}
          alt=''
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: OG_WIDTH,
            height: OG_HEIGHT,
            objectFit: 'cover',
            opacity: 0.12,
          }}
        />
      ) : null}

      {/* Radial glow behind entity image */}
      <div
        style={{
          position: 'absolute',
          right: -96,
          top: -95,
          width: 820,
          height: 820,
          background: `radial-gradient(ellipse 70% 60% at 55% 50%, ${OG_TOKENS.emphasis}26 0%, transparent 70%)`,
        }}
      />

      {/* Entity image — 820×820 at right:-96 top:-95 covers ~60% canvas area */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={data.title}
          style={{
            position: 'absolute',
            width: 820,
            height: 820,
            right: -56,
            top: -95,
            objectFit: 'contain',
            filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.7))',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            width: 820,
            height: 820,
            right: -96,
            top: -95,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <div
            style={{
              display: 'flex',
              width: 280,
              height: 280,
              borderRadius: '50%',
              backgroundColor: OG_TOKENS.surface,
              border: `2px solid ${OG_TOKENS.border}`,
            }}
          />
        </div>
      )}

      {/* Left text panel */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: 620,
          padding: '56px 48px',
          gap: 20,
        }}>
        {/* Title — Junicode heading face with the site's Empyrean Initialem
            drop cap (gradient-clipped, sub-shifted), laid out as
            baseline-aligned word spans because satori cannot flow mixed fonts
            inside one text run. */}
        <div style={{ display: 'flex', alignItems: 'flex-start', columnGap: 6 }}>
          {/* Drop cap column. Computed from font metrics, not eyeballed:
              Empyrean is 1000upem, asc 800 / desc -440, and the A's ink spans
              y 37..769 — all above the baseline, 95px tall at 130px. satori
              clips ink outside the line box, and lineHeight below
              (asc-desc)/upem = 1.24 puts the ink top outside it, so 1.24 is
              the minimum uncut line height. Ink bottom then sits 99px from
              the column top; Junicode 62px/1.1 puts its first baseline 48px
              from the text column top, hence its paddingTop of 51. */}
          <span
            style={{
              display: 'flex',
              position: 'relative',
              fontFamily: '"Empyrean Initialem"',
              fontWeight: 400,
              fontSize: 130,
              lineHeight: 1.24,
              /* The glyph's right side bearing and the line box's descender
                 reserve pad the cap beyond its ink; both trimmed. */
              marginRight: -12,
              marginBottom: -12,
            }}>
            {/* CRT glow dot behind the glyph. Concentric circles at element
                opacity stand in for the site's blurred radial: satori
                composites gradient-alpha and shadow edges too dark, but
                plain element opacity stays clean. */}
            {[
              [84, 0.05],
              [68, 0.08],
              [54, 0.12],
              [42, 0.17],
              [32, 0.24],
              [22, 0.36],
              [14, 0.6],
              [8, 1],
            ].map(([size, opacity]) => (
              <span
                key={size}
                style={{
                  position: 'absolute',
                  left: 52 - size / 2,
                  top: 52 - size / 2,
                  width: size,
                  height: size,
                  borderRadius: 9999,
                  backgroundColor: OG_TOKENS.primary,
                  opacity,
                }}
              />
            ))}
            <span
              style={{
                backgroundImage: `linear-gradient(to bottom, ${OG_TOKENS.accent}, ${OG_TOKENS.actionable}, ${OG_TOKENS.accent})`,
                backgroundClip: 'text',
                color: 'transparent',
              }}>
              {data.title.slice(0, 1)}
            </span>
          </span>

          {/* Remaining title text wraps beside the drop cap. */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'baseline',
              alignContent: 'flex-start',
              columnGap: 16,
              paddingTop: 51,
              fontSize: 62,
              fontWeight: 700,
              fontFamily: '"Junicode"',
              color: OG_TOKENS.primary,
              lineHeight: 1.1,
            }}>
            <span>{data.title.split(' ')[0].slice(1)}</span>
            {data.title
              .split(' ')
              .slice(1)
              .map((word, index) => (
                <span key={index}>{word}</span>
              ))}
          </div>
        </div>

        {/* Tag line (rarity, type, school…) */}
        {tagLine ? (
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              fontWeight: 400,
              color: OG_TOKENS.emphasis,
              letterSpacing: '0.08em',
              textTransform: 'capitalize',
            }}>
            {tagLine}
          </div>
        ) : null}

        {/* Description, faint over the artwork's edge. lineClamp keeps a long
            blurb from colliding with the attribution whatever the title's
            line count. */}
        {watermarkText ? (
          <div
            style={{
              display: 'block',
              lineClamp: 5,
              fontSize: 28,
              fontFamily: '"Inter"',
              color: OG_TOKENS.text,
              opacity: 0.5,
              lineHeight: 1.5,
            }}>
            {watermarkText}
          </div>
        ) : null}

        {/* Site attribution */}
        <div
          style={{
            display: 'flex',
            fontSize: 18,
            color: OG_TOKENS.border,
            marginTop: 'auto',
            letterSpacing: '0.04em',
          }}>
          Library of Ikuisuus
        </div>
      </div>
    </div>
  );
}
