/**
 * @fileoverview BoonSubOptions Unit Tests
 * @description Verifies the variable-cost boon sub-option selector: radio vs
 * checkbox by mode, cost/effect display, onChange wiring, readOnly disabling,
 * and dice-shortcode stripping.
 *
 * @module tests/unit/src/modules/character-builder/presentation/builder/boonSubOptions
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import type { BloodlineBoonSubOption } from '@/lib/db/content/schemas/bloodlineMetadata';
import { BoonSubOptions } from '@/modules/character-builder/presentation/builder/boonSubOptions';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const OPTIONS: BloodlineBoonSubOption[] = [
  { name: 'Powerful Build', bpValue: 1, effect: 'Medium — carry more' },
  { name: 'Large Frame', bpValue: 3, effect: 'Large — 10 ft space' },
];

describe('BoonSubOptions', () => {
  it('renders radios with cost and effect for choose-one mode', () => {
    render(
      <BoonSubOptions
        boonName='Frame'
        options={OPTIONS}
        mode='choose-one'
        selected={[]}
        readOnly={false}
        bpUnitLabel='BP'
        onChange={vi.fn()}
      />,
    );
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(screen.getByText('Powerful Build')).toBeTruthy();
    expect(screen.getByText('1 BP')).toBeTruthy();
    expect(screen.getByText('Medium — carry more')).toBeTruthy();
  });

  it('renders checkboxes for pick-any mode and reflects the selection', () => {
    render(
      <BoonSubOptions
        boonName='Vision'
        options={OPTIONS}
        mode='pick-any'
        selected={['Large Frame']}
        readOnly={false}
        bpUnitLabel='BP'
        onChange={vi.fn()}
      />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toHaveAttribute('aria-checked', 'false');
    expect(checkboxes[1]).toHaveAttribute('aria-checked', 'true');
  });

  it('fires onChange with the toggled option name', () => {
    const onChange = vi.fn();
    render(
      <BoonSubOptions
        boonName='Frame'
        options={OPTIONS}
        mode='choose-one'
        selected={[]}
        readOnly={false}
        bpUnitLabel='BP'
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getAllByRole('radio')[1]);
    expect(onChange).toHaveBeenCalledWith('Large Frame');
  });

  it('disables the group when readOnly', () => {
    render(
      <BoonSubOptions
        boonName='Frame'
        options={OPTIONS}
        mode='choose-one'
        selected={[]}
        readOnly={true}
        bpUnitLabel='BP'
        onChange={vi.fn()}
      />,
    );
    const radios = screen.getAllByRole('radio') as HTMLButtonElement[];
    expect(radios[0].disabled).toBe(true);
  });

  it('strips dice shortcodes from the effect summary', () => {
    render(
      <BoonSubOptions
        boonName='Natural Weapons'
        options={[
          { name: 'Claws', bpValue: 1, effect: '[% 1d4 slashing %] — Melee' },
        ]}
        mode='choose-one'
        selected={[]}
        readOnly={false}
        bpUnitLabel='BP'
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('1d4 slashing — Melee')).toBeTruthy();
  });

  it('strips inline markdown emphasis from the effect summary', () => {
    render(
      <BoonSubOptions
        boonName='Urban Explorer'
        options={[
          {
            name: 'City Sense',
            bpValue: 5,
            effect:
              'Often **at home in cities**, navigating *complex* social structures.',
          },
        ]}
        mode='pick-any'
        selected={[]}
        readOnly={false}
        bpUnitLabel='BP'
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByText(
        'Often at home in cities, navigating complex social structures.',
      ),
    ).toBeTruthy();
  });
});
