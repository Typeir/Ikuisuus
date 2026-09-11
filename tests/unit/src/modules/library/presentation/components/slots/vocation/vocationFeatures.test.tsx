/**
 * @fileoverview Tests for the feature heading collector a vocation card runs.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/vocation/vocationFeatures.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-06
 */

import Feature, { Trait } from '@/modules/library/presentation/components/slots/feature/Feature';
import { Level } from '@/modules/library/presentation/components/slots/utils/slotElements';
import { collectFeatureHeadings } from '@/modules/library/presentation/components/slots/vocation/vocationFeatures';
import React from 'react';
import { describe, expect, it } from 'vitest';

describe('collectFeatureHeadings', () => {
  it('finds Feature blocks at any depth, in page order, with level and heading', () => {
    const nodes = (
      <>
        <p>Prose.</p>
        <Feature level='1'>
          <h2>Expertise</h2>
          <p>Choose two.</p>
        </Feature>
        <div>
          <section>
            <Feature level='3'>
              <h2>Steady Aim</h2>
            </Feature>
          </section>
        </div>
        <Feature level='19'>
          <h2>Epic Boon</h2>
        </Feature>
      </>
    );
    expect(collectFeatureHeadings(nodes)).toEqual([
      { level: 1, name: 'Expertise' },
      { level: 3, name: 'Steady Aim' },
      { level: 19, name: 'Epic Boon' },
    ]);
  });

  it('reads the level from the element form and skips blocks without a level or a heading', () => {
    const nodes = (
      <>
        <Feature>
          <h2>Cunning Action</h2>
          <p>
            <Level>2</Level>
          </p>
        </Feature>
        <Feature>
          <h2>No level</h2>
        </Feature>
        <Feature level='4'>
          <p>No heading.</p>
        </Feature>
        <Trait level='5'>
          <h4>Not a vocation feature</h4>
        </Trait>
      </>
    );
    expect(collectFeatureHeadings(nodes)).toEqual([{ level: 2, name: 'Cunning Action' }]);
  });
});
