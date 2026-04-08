/**
 * Bloodline Metadata Schema Unit Tests
 *
 * @fileoverview Tests for bloodline metadata domain schema type exports.
 *
 * @module tests/unit/lib/db/content/schemas/bloodlineMetadata
 */

import type {
  BloodlineBoon,
  BloodlineCoreFeatures,
  BloodlineIndexEntry,
  BloodlineMetadata,
} from '@/lib/db/content/schemas/bloodlineMetadata';
import { describe, expect, it } from 'vitest';

describe('BloodlineMetadata Schema', () => {
  it('should accept a valid BloodlineCoreFeatures object', () => {
    const coreFeatures: BloodlineCoreFeatures = {
      abilityScores: ['DEX +2', 'CHA +1'],
      movementSpeeds: ['Walk: 30 ft.'],
      senses: ['Darkvision 60 ft.'],
      size: ['Medium'],
      creatureTypes: ['Humanoid'],
      age: 'About a century',
    };

    expect(coreFeatures.abilityScores).toHaveLength(2);
    expect(coreFeatures.senses[0]).toContain('Darkvision');
  });

  it('should accept a boon with numeric bpValue', () => {
    const boon: BloodlineBoon = {
      name: 'Extended Reach',
      bpLabel: '6 BP',
      bpValue: 6,
      sortOrder: 0,
      tags: ['mechanic:weapon-reach', 'mechanic:weapon'],
    };

    expect(boon.bpValue).toBe(6);
    expect(boon.sortOrder).toBe(0);
  });

  it('should accept a boon with variable cost and tags', () => {
    const boon: BloodlineBoon = {
      name: 'Adaptive Gift',
      bpLabel: 'Variable BP - Choose One',
      sortOrder: 1,
      tags: ['mechanic:variable-cost', 'mechanic:choice'],
    };

    expect(boon.bpValue).toBeUndefined();
    expect(boon.tags).toContain('mechanic:choice');
  });

  it('should accept a complete BloodlineMetadata record', () => {
    const metadata: BloodlineMetadata = {
      slug: 'empyrean',
      title: 'Empyrean',
      file: 'src/content/en/character-creation/bloodlines/empyrean.mdx',
      link: '/library/character-creation/bloodlines/empyrean',
      description: 'Celestial-blooded descendants.',
      coreFeatures: {
        abilityScores: ['CHA +2'],
        movementSpeeds: ['Walk: 30 ft.'],
        senses: ['Darkvision 30 ft.'],
        size: ['Medium'],
        creatureTypes: ['Humanoid', 'Celestial'],
      },
      boonBudget: 10,
      boons: [
        {
          name: 'Luminous Strike',
          bpLabel: '4 BP',
          bpValue: 4,
          sortOrder: 0,
          tags: ['damage:radiant', 'mechanic:extra-damage'],
        },
      ],
      tags: ['lineage:empyrean', 'theme:celestial'],
      indexVersion: 1,
    };

    expect(metadata.slug).toBe('empyrean');
    expect(metadata.boonBudget).toBe(10);
    expect(metadata.boons).toHaveLength(1);
  });

  it('should accept a BloodlineIndexEntry projection', () => {
    const entry: BloodlineIndexEntry = {
      slug: 'foulblood',
      title: 'Foulblood',
      size: ['Small', 'Medium'],
      creatureTypes: ['Humanoid', 'Aberration'],
    };

    expect(entry.title).toBe('Foulblood');
    expect(entry.creatureTypes?.[1]).toBe('Aberration');
  });
});
