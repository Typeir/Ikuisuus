/**
 * @fileoverview Unit tests for the spell lists block.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/SpellLists.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-08
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import SpellLists from '@/modules/library/presentation/components/slots/SpellLists';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import(
    '../../../../../../../setup/intlMock'
  );
  const library = (
    await import('../../../../../../../../messages/en/library.json')
  ).default;
  return createRealMessageIntlMock(
    await importOriginal<Record<string, unknown>>(),
    { library },
  );
});

describe('SpellLists', () => {
  it('writes one link per declared list, in order', () => {
    render(<SpellLists members='wizard, villein' />);

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'Wizard Spell List',
      'Villein Spell List',
    ]);
    expect(links[0]).toHaveAttribute(
      'href',
      '/en/library/character-creation/vocations/wizard/spells',
    );
  });

  it('takes the lists as an array too', () => {
    render(<SpellLists members={['wizard']} />);

    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('links a specialization to its own list', () => {
    render(<SpellLists members='paladin/oath-of-devotion' />);

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/en/library/character-creation/vocations/paladin/oath-of-devotion',
    );
  });

  it('writes nothing when no list is named', () => {
    const { container } = render(<SpellLists />);

    expect(container).toBeEmptyDOMElement();
  });
});
