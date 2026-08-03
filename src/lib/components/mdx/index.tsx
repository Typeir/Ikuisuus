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
import mdxComponents from '@/modules/library/infrastructure/compile/mdxComponents';
import BlendedImage from '@/modules/library/presentation/components/BlendedImage/index';
import ClearFloats from '@/modules/library/presentation/components/ClearFloats/index';
import Collapsible from '@/modules/library/presentation/components/Collapsible/index';
import DiceRoll from '@/modules/library/presentation/components/DiceRoll/index';
import Unit from '@/modules/library/presentation/components/Unit/index';
import UnitSwitcher from '@/modules/library/presentation/components/UnitSwitcher/index';
import FlexRenderer from '@/modules/library/presentation/components/FlexRenderer/index';
import FloatedContainer from '@/modules/library/presentation/components/FloatedContainer/index';
import { HashNavigationProvider } from '@/modules/library/presentation/components/HashNavigationProvider/index';
import {
    H1,
    H2,
    H3,
    H4,
    H5,
    H6,
} from '@/modules/library/presentation/components/Heading/index';
import HorizontalSplit from '@/modules/library/presentation/components/HorizontalSplit/index';
import Meta from '@/modules/library/presentation/components/Meta/index';
import ParallaxBackdrop from '@/modules/library/presentation/components/ParallaxBackdrop/index';
import Tooltip from '@/modules/library/presentation/components/Tooltip/index';
import {
    FeatTable,
    FilteredSpellTable,
    HeirloomTable,
    MonsterTable,
    SpellTable,
    TrinketTable,
} from '@/modules/metadata-tables/presentation';
import type { PropsWithChildren } from 'react';

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

const enrichedComponents = {
  ...mdxComponents,
  ...components,
};

export default enrichedComponents;
export { HashNavigationProvider, useHashNavigation };

