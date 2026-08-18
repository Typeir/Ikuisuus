/**
 * @fileoverview Unit tests for the bespoke button section.
 * @description Verifies the section is omitted when empty, renders one card per entry
 * with a scoped preview rule, labels icon-like entries with an icon rather than text,
 * reports the declaration site and call sites, and sanitises injected declarations.
 *
 * @module tests/unit/src/app/[locale]/labs/dev/buttons/BespokeSection.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/app/[locale]/labs/dev/buttons/BespokeSection
 */

import { BespokeSection } from '@/app/[locale]/labs/dev/buttons/BespokeSection';
import type { BespokeButton } from '@/app/[locale]/labs/dev/buttons/bespokeCatalog';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

/**
 * Builds a bespoke entry, overriding only the fields a test cares about.
 *
 * @param {Partial<BespokeButton>} overrides - Fields to override.
 * @returns {BespokeButton} A complete entry.
 */
function entry(overrides: Partial<BespokeButton> = {}): BespokeButton {
  return {
    id: 'bespoke-1',
    className: 'summonBtn',
    module: 'character-builder',
    stylesheet: 'src/modules/character-builder/builderSplitPane.module.scss',
    line: 14,
    decls: { padding: '0.25rem', cursor: 'pointer' },
    mixins: [],
    buttonMixins: [],
    channel: 'handrolled',
    nearest: { name: 'iconBordered', score: 0.17 },
    usages: [
      {
        relativePath: 'src/modules/character-builder/BuilderSplitPane.tsx',
        line: 77,
        module: 'character-builder',
        file: 'BuilderSplitPane.tsx',
      },
    ],
    isModifier: false,
    ...overrides,
  };
}

describe('BespokeSection', () => {
  it('renders nothing when there are no entries', () => {
    const { container } = render(
      <BespokeSection title='Empty' note='none' entries={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one card per entry and counts them in the heading', () => {
    render(
      <BespokeSection
        title='Hand-rolled'
        note='note'
        entries={[entry(), entry({ id: 'bespoke-2', className: 'rollBtn' })]}
      />,
    );
    expect(screen.getAllByTestId('bespoke-name')).toHaveLength(2);
    expect(
      screen.getByRole('heading', { name: /Hand-rolled/ }),
    ).toHaveTextContent('2');
  });

  it('injects a preview rule scoped to the entry id', () => {
    const { container } = render(
      <BespokeSection title='t' note='n' entries={[entry()]} />,
    );
    const style = container.querySelector('style');
    expect(style?.textContent).toContain("[data-bespoke='bespoke-1']");
    expect(style?.textContent).toContain('cursor:pointer');
  });

  it('strips angle brackets so a value cannot close the style element', () => {
    const { container } = render(
      <BespokeSection
        title='t'
        note='n'
        entries={[entry({ decls: { content: '"</style><b>"' } })]}
      />,
    );
    expect(container.querySelector('style')?.textContent).not.toContain('<');
  });

  it('previews an icon-like entry with an icon rather than its name', () => {
    render(
      <BespokeSection
        title='t'
        note='n'
        entries={[entry({ nearest: { name: 'iconRound', score: 0.4 } })]}
      />,
    );
    const button = screen.getByRole('button', { name: 'summonBtn' });
    expect(button.querySelector('svg')).toBeInTheDocument();
    expect(button).not.toHaveTextContent('summonBtn');
  });

  it('previews a text entry with its class name', () => {
    render(
      <BespokeSection
        title='t'
        note='n'
        entries={[entry({ nearest: { name: 'row', score: 0.4 } })]}
      />,
    );
    expect(screen.getByRole('button', { name: 'summonBtn' })).toHaveTextContent(
      'summonBtn',
    );
  });

  it('reports where the class is declared', () => {
    render(<BespokeSection title='t' note='n' entries={[entry()]} />);
    expect(
      screen.getByText(
        /declared character-builder > builderSplitPane\.module\.scss:14/,
      ),
    ).toBeInTheDocument();
  });

  it('omits the line number when the declaration could not be located', () => {
    render(
      <BespokeSection title='t' note='n' entries={[entry({ line: 0 })]} />,
    );
    expect(
      screen.getByText(
        /declared character-builder > builderSplitPane\.module\.scss$/,
      ),
    ).toBeInTheDocument();
  });

  it('lists call sites as module > file:line', () => {
    render(<BespokeSection title='t' note='n' entries={[entry()]} />);
    expect(screen.getByTitle(/BuilderSplitPane\.tsx:77$/)).toHaveTextContent(
      'character-builder > BuilderSplitPane.tsx:77',
    );
  });

  it('names the mixins a re-skin builds on', () => {
    render(
      <BespokeSection
        title='t'
        note='n'
        entries={[entry({ channel: 'mixin', buttonMixins: ['button-ghost'] })]}
      />,
    );
    expect(screen.getByText('button-ghost')).toBeInTheDocument();
  });

  it('says so when nothing canonical matches', () => {
    render(
      <BespokeSection
        title='t'
        note='n'
        entries={[entry({ nearest: { name: null, score: 0 } })]}
      />,
    );
    expect(screen.getByText(/no canonical match/)).toBeInTheDocument();
  });
});
