/**
 * @fileoverview MDX components for prose compiled inside a table row.
 * @description Row cells sit inside the row's own link, so any anchor the
 * compiled prose emits would nest inside it and break hydration.
 *
 * @module lib/components/mdx/metadataTables/useRowSafeComponents
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { mdxComponents } from '@/modules/library/presentation';
import { useMemo, type ComponentProps } from 'react';

/**
 * Anchor replacement
 *
 * @param {ComponentProps<'a'>} props - Anchor props from the compiled prose
 * @param {string} [props.href] - Destination the prose named
 * @param {string} [props.title] - Title the prose named
 * @param {React.ReactNode} [props.children] - Link label
 * @returns {JSX.Element} Inert label
 */
function InertLink({ href, title, children }: ComponentProps<'a'>) {
  return <span title={title ?? href}>{children}</span>;
}

/**
 * MDX component registry for prose rendered inside a row link.
 *
 * @description Anchors become inert labels and keywords render on their
 * `noLink` form, so a cell shows what the page shows without nesting an
 * anchor inside the row's own.
 *
 * @returns {Record<string, unknown>} Component registry for {@link compileRuntimeSync}
 */
export function useRowSafeComponents(): Record<string, unknown> {
  return useMemo(() => {
    const Keyword = mdxComponents.Keyword;

    return {
      ...mdxComponents,
      a: InertLink,
      Keyword: (props: ComponentProps<typeof Keyword>) => (
        <Keyword {...props} noLink />
      ),
    };
  }, []);
}
