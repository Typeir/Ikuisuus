/**
 * @fileoverview OG image JSX template for satori.
 *
 * Renders a 1200×630 dark-theme card using only satori-compatible inline
 * styles (no CSS classes, no CSS variables). The layout is a two-column
 * split: left 40% for text, right 60% for the entity image that extends
 * beyond the canvas with 12% overflow on right/top/bottom. The description
 * renders as a faint watermark behind the entity image.
 *
 * Layer stack (back → front):
 * 1. Solid background (`OG_TOKENS.bg`)
 * 2. Description watermark at opacity 0.07 (italic Crimson Text)
 * 3. Radial gradient glow behind the entity image
 * 4. Entity image (820×820) with drop-shadow, positioned to clip
 * 5. Text panel: title, type/rarity tag line, site attribution
 *
 * This component must only use the React element syntax that satori supports:
 * no hooks, no context, no browser APIs.
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
 * This is a plain function component — it must remain free of hooks, event
 * handlers, and browser globals so that satori can convert it to SVG in a
 * Node.js context.
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

      {/* Description watermark layered behind the entity image */}
      {watermarkText ? (
        <div
          style={{
            position: 'absolute',
            left: 50,
            top: 50,
            width: 500,
            height: OG_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 120px 40px 40px',
            overflow: 'hidden',
          }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              fontSize: 28,
              fontFamily: '"Crimson Text"',
              fontStyle: 'italic',
              color: OG_TOKENS.text,
              opacity: 0.5,
              lineHeight: 1.6,
              textAlign: 'center',
            }}>
            {watermarkText}
          </div>
        </div>
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

      {/* Left text panel — 40% width */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: 480,
          padding: '56px 48px',
          gap: 20,
        }}>
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

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 62,
            fontWeight: 700,
            color: OG_TOKENS.text,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}>
          {data.title}
        </div>

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
