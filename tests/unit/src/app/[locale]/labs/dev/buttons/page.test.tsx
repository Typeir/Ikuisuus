/**
 * @fileoverview Unit tests for the button catalogue page.
 * @description Verifies the bare primary is prepended, canonical reach counts both
 * doors, a variant dead through both doors is flagged, bespoke entries are split by
 * channel, and state modifiers are listed separately.
 *
 * @module tests/unit/src/app/[locale]/labs/dev/buttons/page.test
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/app/[locale]/labs/dev/buttons/page
 */

import type { BespokeButton } from '@/app/[locale]/labs/dev/buttons/bespokeCatalog';
import type { ButtonVariant } from '@/app/[locale]/labs/dev/buttons/buttonCatalog';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const VARIANTS: ButtonVariant[] = [
  {
    name: 'neutral',
    doc: 'Neutral filled button.',
    group: 'Filled / solid',
    mixins: ['button-base'],
    signatureMixins: [],
    usages: [
      {
        module: 'character-builder',
        file: 'attacksTable.tsx',
        relativePath: 'src/modules/character-builder/attacksTable.tsx',
        line: 214,
      },
    ],
    mixinConsumers: [],
    decls: { padding: '0.5rem' },
  },
  {
    name: 'ghost',
    doc: 'Text-only ghost.',
    group: 'Minimal chrome',
    mixins: ['button-ghost'],
    signatureMixins: ['button-ghost'],
    usages: [],
    mixinConsumers: ['previewToggle (src/modules/x/x.module.scss)'],
    decls: {},
  },
  {
    name: 'tab',
    doc: 'Segmented tab.',
    group: 'Segmented tabs',
    mixins: ['button-tab'],
    signatureMixins: ['button-tab'],
    usages: [],
    mixinConsumers: [],
    decls: {},
  },
];

const BESPOKE: BespokeButton[] = [
  {
    id: 'bespoke-1',
    className: 'previewToggle',
    module: 'character-builder',
    stylesheet: 'src/modules/character-builder/abilities.module.scss',
    line: 194,
    decls: { padding: '0.25rem', cursor: 'pointer' },
    mixins: ['button-ghost'],
    buttonMixins: ['button-ghost'],
    channel: 'mixin',
    nearest: { name: 'ghost', score: 0.29 },
    usages: [
      {
        relativePath: 'src/modules/character-builder/Abilities.tsx',
        line: 88,
        module: 'character-builder',
        file: 'Abilities.tsx',
      },
    ],
    isModifier: false,
  },
  {
    id: 'bespoke-2',
    className: 'removeBtn',
    module: 'lib',
    stylesheet: 'src/lib/components/ui/chip/chip.module.scss',
    line: 65,
    decls: { padding: '0', border: 'none', cursor: 'pointer' },
    mixins: [],
    buttonMixins: [],
    channel: 'handrolled',
    nearest: { name: 'iconRound', score: 1 },
    usages: [
      {
        relativePath: 'src/lib/components/ui/chip/Chip.tsx',
        line: 42,
        module: 'lib',
        file: 'Chip.tsx',
      },
    ],
    isModifier: false,
  },
  {
    id: 'bespoke-3',
    className: 'open',
    module: 'lib',
    stylesheet: 'src/lib/components/ui/filterSelect/filterSelect.module.scss',
    line: 30,
    decls: { color: 'red' },
    mixins: [],
    buttonMixins: [],
    channel: 'handrolled',
    nearest: { name: null, score: 0 },
    usages: [],
    isModifier: true,
  },
];

vi.mock('@/app/[locale]/labs/dev/buttons/buttonCatalog', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  loadCanonicalDeclarations: vi.fn(async () => ({ neutral: {} })),
  loadCanonicalVariants: vi.fn(async () => VARIANTS),
}));

vi.mock('@/app/[locale]/labs/dev/buttons/bespokeCatalog', () => ({
  loadBespokeButtons: vi.fn(async () => BESPOKE),
}));

const { default: LabsButtonsPage, generateMetadata } =
  await import('@/app/[locale]/labs/dev/buttons/page');

describe('LabsButtonsPage', () => {
  beforeEach(async () => {
    render(await LabsButtonsPage());
  });

  const canonicalNames = () =>
    screen.getAllByTestId('canonical-name').map((el) => el.textContent);

  it('prepends the bare primary variant', () => {
    expect(canonicalNames()[0]).toBe('<button>');
  });

  it('renders each canonical variant class name', () => {
    expect(canonicalNames()).toEqual([
      '<button>',
      'btn.neutral',
      'btn.ghost',
      'btn.tab',
    ]);
  });

  it('renders canonical call sites as module > file:line', () => {
    expect(screen.getByTitle(/attacksTable\.tsx:214$/)).toHaveTextContent(
      'character-builder > attacksTable.tsx:214',
    );
  });

  it('flags only the variant dead through both doors', () => {
    expect(screen.getAllByText(/dead through both doors/i)).toHaveLength(1);
  });

  it('credits a variant reached only through its mixin', () => {
    expect(screen.getByText(/via mixin: 1 class/)).toBeInTheDocument();
  });

  it('separates bespoke re-skins from hand-rolled classes', () => {
    expect(
      screen.getByRole('heading', { name: /built on canonical mixins/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /fully hand-rolled/i }),
    ).toBeInTheDocument();
  });

  it('renders a bespoke class with its declaration site', () => {
    const names = screen
      .getAllByTestId('bespoke-name')
      .map((el) => el.textContent);
    expect(names).toContain('.removeBtn');
    expect(
      screen.getByText(/declared lib > chip\.module\.scss:65/),
    ).toBeInTheDocument();
  });

  it('shows the nearest canonical score for a hand-rolled class', () => {
    expect(screen.getByText('btn.iconRound')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('lists state modifiers separately from real buttons', () => {
    expect(
      screen.getByRole('heading', { name: /state modifiers/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('.open')).toBeInTheDocument();
    expect(
      screen.getAllByTestId('bespoke-name').map((el) => el.textContent),
    ).not.toContain('.open');
  });

  it('counts canonical variants including the bare primary', () => {
    expect(screen.getByText('Canonical').nextElementSibling).toHaveTextContent(
      '4',
    );
  });

  it('counts hand-rolled classes excluding modifiers', () => {
    expect(
      screen.getByText('Hand-rolled').nextElementSibling,
    ).toHaveTextContent('1');
  });
});

describe('generateMetadata', () => {
  it('titles the page', () => {
    expect(generateMetadata().title).toContain('Buttons');
  });
});
