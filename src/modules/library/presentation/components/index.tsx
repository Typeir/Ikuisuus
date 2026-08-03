/**
 * @fileoverview Module for src/lib/components/mdx/index.tsx
 * Provides a centralized export of MDX components and related utilities for use across the application.
 * Uses React.ComponentProps to avoid auto-removal of necessary React import by linters/build tools.
 * @module src/lib/components/mdx/index
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import { useHashNavigation } from '@/modules/library/application/hooks/useHashNavigation';
import {
    FeatTable,
    FilteredSpellTable,
    HeirloomTable,
    MonsterTable,
    SpellTable,
    TrinketTable,
} from '@/modules/metadata-tables/presentation';
import type { PropsWithChildren } from 'react';
import BlendedImage from './BlendedImage';
import ClearFloats from './ClearFloats';
import Collapsible from './Collapsible';
import DiceRoll from './DiceRoll';
import FlexRenderer from './FlexRenderer';
import FloatedContainer from './FloatedContainer';
import { HashNavigationProvider } from './HashNavigationProvider';
import { H1, H2, H3, H4, H5, H6 } from './Heading';
import HorizontalSplit from './HorizontalSplit';
import Meta from './Meta';
import ParallaxBackdrop from './ParallaxBackdrop';
import { SectionTrack } from './SectionTrack';
import Tooltip from './Tooltip';
import Unit from './Unit';
import UnitSwitcher from './UnitSwitcher';

export const components = {
  BlendedImage,
  Collapsible,
  DiceRoll,
  Unit,
  UnitSwitcher,
  FlexRenderer,
  Meta,
  MonsterTable,
  HeirloomTable,
  FeatTable,
  FilteredSpellTable,
  SpellTable,
  TrinketTable,
  HorizontalSplit,
  FloatedContainer,
  ClearFloats,
  ParallaxBackdrop,
  SectionTrack,
  Tooltip,
  Image: (props: React.ComponentProps<typeof Image>) => (
    <Image
      {...props}
      width={600}
      height={600}
      alt={props.alt || ''}
      title={props.title ?? props.alt ?? undefined}
    />
  ),
  a: ({ href, title, children, ...props }: React.ComponentProps<'a'>) => {
    const childText = typeof children === 'string' ? children : undefined;
    return (
      <Link
        href={href ?? '#'}
        title={title ?? childText}
        {...(props as object)}>
        {children}
      </Link>
    );
  },
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  table: ({ children }: PropsWithChildren<{}>) => (
    <div className='overflow-x-auto max-w-full'>
      <table>{children}</table>
    </div>
  ),
};

/**
 * Reusable content regions are spliced in at source level before compilation,
 * so they no longer arrive as pre-rendered components. The generated map is
 * retained only until the emitter is deleted; spreading it here would shadow
 * real components whose names collide with a content filename.
 */
const enrichedComponents = {
  ...components,
};

export default enrichedComponents;
export { HashNavigationProvider, SectionTrack, useHashNavigation };

