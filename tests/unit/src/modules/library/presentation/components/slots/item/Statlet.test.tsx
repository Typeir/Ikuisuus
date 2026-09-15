/**
 * @fileoverview Statlet tests.
 * @module tests/unit/src/modules/library/presentation/components/slots/item/Statlet.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import Statlet from '@/modules/library/presentation/components/slots/item/Statlet';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

describe('Statlet', () => {
  it('should stand as an object unless told otherwise', () => {
    const { container } = render(<Statlet defence='12' />);
    expect(container.querySelector('[data-statlet]')).toHaveAttribute(
      'data-statlet-kind',
      'object',
    );
  });

  it('should open with the heading it was given', () => {
    const { container } = render(
      <Statlet defence='12'>
        <h4>Barricade</h4>
        <p>It blocks the way.</p>
      </Statlet>,
    );

    const block = container.querySelector('[data-statlet]');
    expect(block?.firstElementChild?.tagName).toBe('H4');
    expect(screen.getByText('Barricade')).toBeInTheDocument();
  });

  it('should keep the heading out of the body', () => {
    const { container } = render(
      <Statlet defence='12'>
        <h4>Barricade</h4>
        <p>It blocks the way.</p>
      </Statlet>,
    );

    const body = container.querySelector('[data-statlet-body]');
    expect(body?.querySelector('h4')).toBeNull();
    expect(body).toHaveTextContent('It blocks the way.');
  });

  it('should say nothing about identity when it has nothing to say', () => {
    const { container } = render(<Statlet defence='12' />);
    expect(container.querySelector('[data-statlet-identity]')).toBeNull();
  });

  it('should name a creature by its size, type and alignment', () => {
    const { container } = render(
      <Statlet kind='creature' size='Medium' type='Construct' alignment='Neutral' />,
    );
    expect(container.querySelector('[data-statlet-identity]')).toHaveTextContent(
      'Medium Construct, Neutral',
    );
  });

  it('should leave an object its size and no alignment', () => {
    const { container } = render(
      <Statlet size='Large' type='Construct' alignment='Neutral' />,
    );
    expect(container.querySelector('[data-statlet-identity]')).toHaveTextContent(
      'Large',
    );
  });

  it('should give an object a damage threshold where a creature has speed', () => {
    const { container: object } = render(
      <Statlet defence='15' deflect='5' dodge='0' hitPoints='30' damageThreshold='10' speed='0 ft.' />,
    );
    const shown = object.querySelector('[data-statlet-defences]');
    expect(shown).toHaveTextContent('10');
    expect(shown).not.toHaveTextContent('0 ft.');
  });

  it('should give abilities to a creature and none to an object', () => {
    const { container: beast } = render(
      <Statlet kind='creature' str='16' dex='10' />,
    );
    expect(
      beast.querySelector('[data-statlet-abilities]'),
    ).not.toBeNull();

    const { container: thing } = render(<Statlet str='16' />);
    expect(thing.querySelector('[data-statlet-abilities]')).toBeNull();
  });

  it('should list only the slots it was given', () => {
    const { container } = render(
      <Statlet kind='creature' senses='Darkvision 60 ft.' />,
    );
    const stats = container.querySelector('[data-statlet-stats]');
    expect(stats).toHaveTextContent('Darkvision 60 ft.');
    expect(stats?.children).toHaveLength(1);
  });

  it('should hold nothing back when it was given nothing but a body', () => {
    const { container } = render(
      <Statlet>
        <p>Just prose.</p>
      </Statlet>,
    );
    expect(container.querySelector('[data-statlet-stats]')).toBeNull();
    expect(container.querySelector('[data-statlet-body]')).toHaveTextContent(
      'Just prose.',
    );
  });
});
