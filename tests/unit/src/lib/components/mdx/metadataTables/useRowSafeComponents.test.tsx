/**
 * @fileoverview useRowSafeComponents tests
 * @description Verifies the registry replaces anchors with inert labels and
 * puts keywords on their `noLink` form
 *
 * @module tests/unit/src/lib/components/mdx/metadataTables/useRowSafeComponents.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { useRowSafeComponents } from '@/lib/components/mdx/metadataTables/useRowSafeComponents';
import { render, renderHook, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { describe, expect, it, vi } from 'vitest';

const keywordSpy = vi.fn();

vi.mock('@/modules/library/presentation', () => ({
  mdxComponents: {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    a: ({ href, children }: any) => <a href={href}>{children}</a>,
    Keyword: (props: any) => {
      keywordSpy(props);
      return <span>{props.term}</span>;
    },
    strong: ({ children }: any) => <strong>{children}</strong>,
  },
}));

describe('useRowSafeComponents', () => {
  it('renders an anchor as a label carrying its destination', () => {
    const { result } = renderHook(() => useRowSafeComponents());
    const Anchor = result.current.a as ComponentType<{
      href?: string;
      children?: React.ReactNode;
    }>;

    const { container } = render(<Anchor href='/en/library/x'>Label</Anchor>);

    expect(container.querySelector('a')).toBeNull();
    expect(screen.getByTitle('/en/library/x')).toHaveTextContent('Label');
  });

  it('passes noLink to keywords', () => {
    const { result } = renderHook(() => useRowSafeComponents());
    const Keyword = result.current.Keyword as ComponentType<{ term: string }>;

    render(<Keyword term='repose' />);

    expect(keywordSpy).toHaveBeenCalledWith(
      expect.objectContaining({ term: 'repose', noLink: true }),
    );
  });

  it('keeps every other component from the registry', () => {
    const { result } = renderHook(() => useRowSafeComponents());

    expect(result.current.strong).toBeTypeOf('function');
  });
});
