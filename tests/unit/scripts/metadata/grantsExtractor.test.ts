/**
 * @fileoverview Grant extractor tests
 * @description Verifies conservative prose → grant-tag extraction and the
 * frontmatter override, which fully replaces the prose parse for any feature
 * it names (an empty list suppresses a misread feature).
 *
 * @module tests/unit/scripts/metadata/grantsExtractor
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { describe, expect, it } from 'vitest';
import {
  extractFeatureGrants,
  extractGrantsFromProse,
} from '../../../../scripts/metadata/extraction/grantsExtractor';

describe('extractGrantsFromProse', () => {
  it('extracts a weapon category grant', () => {
    expect(extractGrantsFromProse('Gain proficiency with Martial weapons.')).toContain(
      'weapon:martial',
    );
  });

  it('extracts armor category and shields', () => {
    const grants = extractGrantsFromProse(
      'You gain proficiency with medium armor and shields.',
    );
    expect(grants).toContain('armor:medium');
    expect(grants).toContain('armor:shield');
  });

  it('extracts a skill proficiency', () => {
    expect(
      extractGrantsFromProse('You gain proficiency with the Medicine skill.'),
    ).toContain('skill:medicine:proficient');
  });

  it('prefers expertise over proficiency for a skill', () => {
    expect(extractGrantsFromProse('You gain Expertise in Persuasion.')).toContain(
      'skill:persuasion:expertise',
    );
  });

  it('extracts a multi-word skill', () => {
    expect(
      extractGrantsFromProse('You gain proficiency in Sleight of Hand.'),
    ).toContain('skill:sleight-of-hand:proficient');
  });

  it('extracts a saving throw', () => {
    expect(
      extractGrantsFromProse('You gain proficiency in Dexterity saving throws.'),
    ).toContain('saving_throw:dexterity');
  });

  it('extracts a trade when the tools keyword is present', () => {
    expect(
      extractGrantsFromProse('You gain proficiency with Smithing tools.'),
    ).toContain('trade:smithing:proficient');
  });

  it('resolves agent-noun trade forms (smith / alchemist, tools / supplies)', () => {
    const grants = extractGrantsFromProse(
      "You gain proficiency with smith's tools and alchemist's supplies.",
    );
    expect(grants).toContain('trade:smithing:proficient');
    expect(grants).toContain('trade:alchemy:proficient');
  });

  it('emits nothing without a proficiency keyword', () => {
    expect(
      extractGrantsFromProse('The music swells and the light fades.'),
    ).toEqual([]);
  });
});

describe('extractFeatureGrants', () => {
  it('replaces the prose parse with the override when the feature is named', () => {
    const grants = extractFeatureGrants(
      'Duelist',
      'You gain proficiency with Martial weapons.',
      { Duelist: ['weapon:rapier'] },
    );
    expect(grants).toEqual(['weapon:rapier']);
  });

  it('suppresses a misread feature when the override is an empty list', () => {
    const scholarProse =
      'Choose one of your skill proficiencies from: Arcana, History, ' +
      'Investigation, Medicine, Nature, or Religion. You gain Expertise in that skill.';
    expect(extractGrantsFromProse(scholarProse).length).toBeGreaterThan(0);
    expect(extractFeatureGrants('Scholar', scholarProse, { Scholar: [] })).toEqual(
      [],
    );
  });

  it('falls back to the prose parse for a feature absent from the override map', () => {
    expect(
      extractFeatureGrants('Unlisted', 'You gain Expertise in Persuasion.', {
        Other: ['armor:heavy'],
      }),
    ).toEqual(['skill:persuasion:expertise']);
  });

  it('uses frontmatter alone when prose has no grants', () => {
    expect(
      extractFeatureGrants('Foo', 'no grants here', { Foo: ['armor:heavy'] }),
    ).toEqual(['armor:heavy']);
  });
});
