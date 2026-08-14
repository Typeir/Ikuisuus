/**
 * @file compileMdxToComponent.ts
 * @description Compiles raw MDX source into a React component at runtime.
 *
 * @module compileMdxToComponent
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @fileoverview Compiles MDX source into a React component.
 */

import { compile } from '@mdx-js/mdx';
import { Fragment } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

/**
 * Compiles raw MDX source into a React component.
 *
 * @param {string} source - The raw MDX string to compile.
 * @returns {Promise<React.ComponentType>} - The compiled React component.
 */
export const compileMdxToComponent = async (source: string) => {
  const compiled = await compile(source, {
    outputFormat: 'function-body',
    format: 'mdx',
    providerImportSource: '',
    development: false,
    jsxImportSource: 'react',
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex],
    recmaPlugins: [
      () => (tree) => {
        tree.body = tree.body.filter(
          (node: { type?: string }) => node.type !== 'ExportDefaultDeclaration',
        );
      },
    ],
  });

  const fn = new Function(
    'bindings',
    `${compiled.value}; return { default: MDXContent };`,
  );

  const { default: MDXContent } = fn({
    Fragment,
    jsx,
    jsxs,
  });

  return MDXContent;
};
