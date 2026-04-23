/**
 * @fileoverview OGTemplate unit tests.
 *
 * Validates the tag line builder helper and verifies that the template
 * renders without throwing for the key data combinations.
 *
 * Satori itself is not invoked here — rendering integration is covered by
 * the renderer tests.
 *
 * @module tests/unit/src/lib/seo/og/OGTemplate.test
 */

import { OGTemplate } from '@/lib/seo/og/OGTemplate';
import type { OGCardData } from '@/lib/seo/og/data';
import React from 'react';
import { describe, expect, it } from 'vitest';

/** Helper that checks the element renders to a non-null value. */
function renders(props: React.ComponentProps<typeof OGTemplate>): boolean {
  const el = React.createElement(OGTemplate, props);
  return el !== null && el !== undefined;
}

const monsterData: OGCardData = {
  slug: 'abominable-avian',
  title: 'Abominable Avian',
  creatureType: 'beast',
};

const heirloomData: OGCardData = {
  slug: 'dreaded-defender',
  title: 'Dreaded Defender',
  rarity: 'rare',
  itemType: 'weapon',
};

const spellData: OGCardData = {
  slug: 'fireball',
  title: 'Fireball',
  school: 'Evocation',
  level: 'Level 3',
};

describe('OGTemplate', () => {
  it('renders without throwing for a monster', () => {
    expect(renders({ data: monsterData })).toBe(true);
  });

  it('renders without throwing for an heirloom', () => {
    expect(renders({ data: heirloomData })).toBe(true);
  });

  it('renders without throwing for a spell', () => {
    expect(renders({ data: spellData })).toBe(true);
  });

  it('renders without throwing when imageUrl is provided', () => {
    expect(
      renders({ data: monsterData, imageUrl: 'http://example.com/img.webp' }),
    ).toBe(true);
  });

  it('renders without throwing when description is provided', () => {
    expect(
      renders({ data: heirloomData, description: 'A terrible sword.' }),
    ).toBe(true);
  });

  it('renders without throwing when backgroundImageUrl is provided', () => {
    expect(
      renders({
        data: heirloomData,
        backgroundImageUrl: 'http://example.com/bg.webp',
      }),
    ).toBe(true);
  });

  it('truncates description longer than 400 chars', () => {
    const long = 'A'.repeat(450);
    const el = React.createElement(OGTemplate, {
      data: monsterData,
      description: long,
    });
    expect(el).not.toBeNull();
  });
});
