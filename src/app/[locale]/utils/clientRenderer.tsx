'use client';

import mdxComponents from '@/lib/components/mdx';
import { MDXProvider } from '@mdx-js/react';
import { useEffect, useState } from 'react';

/**
 * Props for MDX dynamic client rendering.
 * @param {string} locale - Current locale
 * @param {string} slug - Path to the .mdx file relative to /content
 */
type Props = {
  locale: string;
  slug: string;
};

export default function ClientRenderer({ locale, slug }: Props) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    const load = async () => {
      const mod = await import(`@content/${locale}/${slug}.mdx`);
      setComponent(() => mod.default);
    };
    load();
  }, [locale, slug]);

  if (!Component) return null;

  return (
    <MDXProvider components={mdxComponents}>
      <Component />
    </MDXProvider>
  );
}
