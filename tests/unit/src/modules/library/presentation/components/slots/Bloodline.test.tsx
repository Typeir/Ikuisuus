/**
 * @fileoverview Unit tests for the Bloodline card.
 * @description The card prints the two Core Features rows as tables, then the
 * boon budget
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/Bloodline.test
 * @version 0.2.0
 * @author Typeir
 * @since 2026-09-07
 */

import Bloodline from '@/modules/library/presentation/components/slots/Bloodline';
import {
  AbilityScores,
  Age,
  CreatureTypes,
  Senses,
  Size,
  Speeds,
} from '@/modules/library/presentation/components/slots/slotElements';
import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

describe('Bloodline', () => {
  it('prints both Core Features rows as tables, the budget, and the page content', () => {
    const { container } = render(
      <Bloodline>
        <p>
          <AbilityScores>DEX +2</AbilityScores>
          <Speeds>Walk: 6 stride</Speeds>
          <Senses>Darkvision</Senses>
        </p>
        <p>
          <Size>Medium</Size>
          <CreatureTypes>Humanoid</CreatureTypes>
          <Age>Centuries</Age>
        </p>
        <p>Body prose.</p>
      </Bloodline>,
    );
    const first = container.querySelector('[data-bloodline-core="1"]');
    const second = container.querySelector('[data-bloodline-core="2"]');
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first?.querySelectorAll('th')).toHaveLength(3);
    expect(first?.querySelector('[data-slot="abilityScores"]')?.textContent).toContain('DEX +2');
    expect(second?.querySelector('[data-slot="age"]')?.textContent).toContain('Centuries');
    expect(container.querySelector('[data-bloodline="true"] p')?.textContent).toBe('Body prose.');
  });


  it('keeps a component written into a cell', () => {
    const { container } = render(
      <Bloodline>
        <p>
          <AbilityScores>DEX +2</AbilityScores>
          <Speeds>Walk</Speeds>
          <Senses>
            <abbr title='only on a shared surface'>Tremorsense</abbr>
          </Senses>
        </p>
      </Bloodline>,
    );
    expect(container.querySelector('[data-slot="senses"] abbr')?.getAttribute('title')).toBe(
      'only on a shared surface',
    );
  });

  it('prints no table and no budget when the page declares neither', () => {
    const { container } = render(
      <Bloodline>
        <p>Body prose.</p>
      </Bloodline>,
    );
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelector('[data-bloodline-budget]')).toBeNull();
    expect(container.querySelector('[data-bloodline="true"]')?.textContent).toBe('Body prose.');
  });
});
