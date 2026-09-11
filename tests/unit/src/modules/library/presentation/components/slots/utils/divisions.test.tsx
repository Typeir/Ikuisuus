/**
 * @fileoverview Unit tests for the sheet division reader.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/utils/divisions.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-08
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import {
  H2,
  H3,
} from '@/modules/library/presentation/components/Heading/Heading';
import {
  anchorsOf,
  byAnchor,
  byRank,
  labelsOf,
  nestDepth,
  readDivisions,
  titleOf,
  type Division,
} from '@/modules/library/presentation/components/slots/utils/divisions';

/**
 * The divisions a run yields, in order.
 *
 * @param {React.ReactNode} children - Siblings to read
 * @param {string} list - Comma separated anchors
 * @returns {Division[]} The divisions found
 */
function divisionsOf(children: React.ReactNode, list: string): Division[] {
  return readDivisions(children, byAnchor(anchorsOf(list))).flatMap((part) =>
    part.kind === 'division' ? [part.division] : [],
  );
}

describe('anchorsOf', () => {
  it('reads a comma separated list, trimmed and lowercased', () => {
    expect([...anchorsOf(' Traits, FEATURES ,, deeds ')]).toEqual([
      'traits',
      'features',
      'deeds',
    ]);
  });

  it('takes the anchor from an entry that also gives a label', () => {
    expect([...anchorsOf('traits: What It Is, deeds')]).toEqual([
      'traits',
      'deeds',
    ]);
  });

  it('is empty for nothing', () => {
    expect(anchorsOf(undefined).size).toBe(0);
  });
});

describe('labelsOf', () => {
  it('keeps only the entries that were given a label', () => {
    expect([...labelsOf('traits: What It Is, features, deeds:  Big Moves ')])
      .toEqual([
        ['traits', 'What It Is'],
        ['deeds', 'Big Moves'],
      ]);
  });
});

describe('titleOf', () => {
  it('unslugs an anchor into the heading it was cut from', () => {
    expect(titleOf('legendary-deeds')).toBe('Legendary Deeds');
    expect(titleOf('traits')).toBe('Traits');
  });
});

describe('readDivisions', () => {
  it('reads a division that arrived wrapped in its section', () => {
    const found = divisionsOf(
      <section data-anchor='features' data-heading-level={2}>
        <h2 data-anchor='features'>Features</h2>
        <p>Body.</p>
      </section>,
      'features',
    );

    expect(found).toHaveLength(1);
    expect(found[0].anchor).toBe('features');
    expect(found[0].name).toBe('Features');
    expect(found[0].section).not.toBeNull();
    expect(found[0].body).toHaveLength(1);
  });

  /* The compiler leaves the first heading inside a component unsectioned so the
     component can use it as its summary, so the division arrives flattened. */
  it('reads a bare heading as a division, taking the siblings below it', () => {
    const found = divisionsOf(
      <>
        <h2 data-anchor='traits'>Traits</h2>
        <p>First.</p>
        <section data-anchor='null-core' data-heading-level={4}>
          <h4 data-anchor='null-core'>Null Core</h4>
        </section>
        <section data-anchor='features' data-heading-level={2}>
          <h2 data-anchor='features'>Features</h2>
        </section>
      </>,
      'traits, features',
    );

    expect(found.map((division) => division.anchor)).toEqual([
      'traits',
      'features',
    ]);
    expect(found[0].section).toBeNull();
    expect(found[0].body).toHaveLength(2);
  });

  it('ends a bare division at a rule', () => {
    const found = divisionsOf(
      <>
        <h2 data-anchor='traits'>Traits</h2>
        <p>Kept.</p>
        <hr />
        <p>Dropped.</p>
      </>,
      'traits',
    );

    expect(found[0].body).toHaveLength(1);
  });

  it('finds a heading that is a component rather than a tag', () => {
    const found = divisionsOf(
      <>
        <H2 data-anchor='traits'>Traits</H2>
        <p>Body.</p>
      </>,
      'traits',
    );

    expect(found[0].anchor).toBe('traits');
    expect(found[0].body).toHaveLength(1);
  });

  /* Server rendering hands a client slot a heading whose parts may still be
     unresolved, so the label comes from the anchor and never from that text. */
  it('names a division whose heading text cannot be read whole', () => {
    const found = divisionsOf(
      <section data-anchor='deeds' data-heading-level={3}>
        <H3 data-anchor='deeds'>{[null, 'eeds']}</H3>
      </section>,
      'deeds',
    );

    expect(found[0].name).toBe('Deeds');
  });

  it('leaves everything it was not asked for alone', () => {
    const parts = readDivisions(
      <>
        <p>Lead.</p>
        <section data-anchor='features' data-heading-level={2}>
          <h2 data-anchor='features'>Features</h2>
        </section>
      </>,
      byAnchor(anchorsOf('traits')),
    );

    expect(parts.every((part) => part.kind === 'loose')).toBe(true);
  });
});

/**
 * A page holding one group, which in turn holds one block.
 *
 * @returns {React.JSX.Element} The nested run
 */
function nested(): React.JSX.Element {
  return (
    <>
      <section data-anchor='features' data-heading-level={2}>
        <h2 data-anchor='features'>Features</h2>
        <section data-anchor='attacks' data-heading-level={3}>
          <h3 data-anchor='attacks'>Attacks</h3>
          <section data-anchor='slam' data-heading-level={5}>
            <h5 data-anchor='slam'>Slam</h5>
            <p>Hits.</p>
          </section>
        </section>
      </section>
      <section data-anchor='traits' data-heading-level={2}>
        <h2 data-anchor='traits'>Traits</h2>
        <p>A passive.</p>
      </section>
    </>
  );
}

describe('byRank', () => {
  it('takes every division written at one rank and no other', () => {
    const found = readDivisions(nested(), byRank(2)).flatMap((part) =>
      part.kind === 'division' ? [part.division.anchor] : [],
    );

    expect(found).toEqual(['features', 'traits']);
  });
});

describe('nestDepth', () => {
  it('counts how many divisions deep a run goes', () => {
    expect(nestDepth(nested())).toBe(3);
  });

  it('calls a run holding no division flat', () => {
    expect(nestDepth(<p>Just prose.</p>)).toBe(0);
  });
});
