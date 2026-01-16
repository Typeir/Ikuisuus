import { compile } from '@mdx-js/mdx';
import { Fragment } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';

/**
 * Compiles raw MDX source into a runtime-safe React component.
 * Useful for rendering MDX dynamically when static import is not possible.
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
    recmaPlugins: [
      () => (tree) => {
        tree.body = tree.body.filter(
          (node: any) => node.type !== 'ExportDefaultDeclaration'
        );
      },
    ],
  });

  const fn = new Function(
    'bindings',
    `${compiled.value}; return { default: MDXContent };`
  );

  const { default: MDXContent } = fn({
    Fragment,
    jsx,
    jsxs,
  });

  return MDXContent;
};
