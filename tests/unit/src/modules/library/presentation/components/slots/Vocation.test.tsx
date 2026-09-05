/**
 * @fileoverview Unit tests for the vocation core traits card.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/Vocation.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-05
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import Vocation from '@/modules/library/presentation/components/slots/Vocation';
import {
  HitDie,
  PrimaryAbility,
} from '@/modules/library/presentation/components/slots/slotElements';
import { printed } from './cardQueries';

describe('Vocation', () => {
  it('prints the core traits in schema order', () => {
    render(
      <Vocation
        primaryAbility='Dexterity and Wisdom'
        hitDie='d8 per Monk level'
        saves='Strength and Dexterity'
        armor='None'>
        <p>Body prose.</p>
      </Vocation>,
    );
    expect(printed()).toEqual(['primaryAbility', 'hitDie', 'saves', 'armor']);
    expect(screen.getByText('Body prose.')).toBeInTheDocument();
  });

  it('reads the element form and keeps schema order regardless of authoring order', () => {
    render(
      <Vocation>
        <p>
          <HitDie>d10 per Warrior level</HitDie>
          <PrimaryAbility>Strength or Dexterity</PrimaryAbility>
        </p>
      </Vocation>,
    );
    expect(printed()).toEqual(['primaryAbility', 'hitDie']);
  });

  it('renders only the body when no trait was written', () => {
    render(
      <Vocation>
        <p>Body only.</p>
      </Vocation>,
    );
    expect(document.querySelector('[data-slot-grid]')).toBeNull();
    expect(screen.getByText('Body only.')).toBeInTheDocument();
  });
});
