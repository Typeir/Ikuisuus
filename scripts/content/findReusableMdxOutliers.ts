/**
 * Reusable MDX Component Detector
 *
 * @fileoverview Analyzes MDX content files to identify and extract reusable components.
 * Compiles detected components into a centralized TypeScript module for import.
 *
 * @module findReusableMdxOutliers
 * @version 1.0.0
 * @since 1.0.0
 *
 * @requires fs.promises File system operations with promises
 * @requires path Path utilities
 * @requires next-mdx-remote-client/rsc MDX evaluation for server components
 * @requires @mdx-js/mdx MDX compilation
 * @requires acorn JavaScript parser
 * @requires acorn-jsx JSX syntax support for acorn
 * @requires react-dom/server Server-side rendering
 * @requires ts-morph TypeScript AST manipulation
 */

import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import * as acorn from 'acorn';
import jsx from 'acorn-jsx';
import * as ReactDOMServer from 'react-dom/server';
import { Project } from 'ts-morph';
import { createLogger } from '@/lib/logging/logger';

const log = createLogger({ script: 'findReusableMdxOutliers' });

/** @constant Path to generated components module */
const OUTPUT_FILE = path.join(
  process.cwd(),
  'src/lib/components/mdx/mdxComponents.tsx',
);

/**
 * Recursively finds all .mdx files in a directory.
 *
 * @param dir - Root directory to search
 * @returns Array of absolute paths to .mdx files
 */
const findMdxFiles = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const files = await Promise.all(
    entries.map(async (entry) => {
      const res = path.resolve(dir, entry.name);
      if (entry.isDirectory()) return findMdxFiles(res);
      if (res.endsWith('.mdx')) return res;
      return [] as string[];
    }),
  );

  return files.flat();
};

/**
 * Converts kebab-case or snake_case to PascalCase.
 * @param str - Input string
 * @returns PascalCase string
 */
const pascalCase = (str: string): string =>
  str
    .replace(/[-_]+/g, ' ')
    .replace(/(?:^|\s)(\w)/g, (_, c: string) => c.toUpperCase())
    .replace(/\s+/g, '');

/**
 * Recursively walks the AST and extracts reusable component references.
 * @param node - AST node
 * @param tags - Set to collect component tag names
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const visitAst = (node: any, tags: Set<string>): void => {
  if (node.type === 'JSXElement') {
    const nameNode = node.openingElement.name;

    if (nameNode.type === 'JSXIdentifier') {
      if (/^[A-Z]/.test(nameNode.name)) {
        tags.add(nameNode.name);
      }
    }

    if (
      nameNode.type === 'JSXMemberExpression' &&
      nameNode.object.name === '_components' &&
      /^[A-Z]/.test(nameNode.property.name)
    ) {
      tags.add(nameNode.property.name);
    }
  }

  for (const key in node) {
    if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
    const child = node[key];

    if (Array.isArray(child)) {
      child.forEach((c) => {
        if (c && typeof c.type === 'string') visitAst(c, tags);
      });
    } else if (child && typeof child.type === 'string') {
      visitAst(child, tags);
    }
  }
};

/**
 * Extracts component tags from compiled MDX.
 * @param compiledJs - Compiled MDX JavaScript source
 * @returns Set of component tag names
 */
const extractTags = (compiledJs: string): Set<string> => {
  const Parser = acorn.Parser.extend(jsx());
  const ast = Parser.parse(compiledJs, {
    ecmaVersion: 'latest',
    sourceType: 'module',
  });

  const tags = new Set<string>();
  visitAst(ast, tags);
  return tags;
};

(async () => {
  const { compile } = await import('@mdx-js/mdx');
  const { evaluate } = await import('next-mdx-remote-client/rsc');

  const contentRoot = path.join(process.cwd(), 'src/content');
  const mdxFiles = await findMdxFiles(contentRoot);

  const mdxMap: Record<string, string> = {};
  for (const file of mdxFiles) {
    const base = path.basename(file, '.mdx');
    mdxMap[pascalCase(base)] = file;
  }

  const outliers = new Set<string>();

  for (const file of mdxFiles) {
    const rawContent = await fs.readFile(file, 'utf8');
    const compiled = await compile(rawContent, {
      jsx: true,
      outputFormat: 'program',
    });

    const tags = extractTags(String(compiled.value));

    for (const tag of tags) {
      if (mdxMap[tag]) {
        outliers.add(tag);
      }
    }
  }

  log.message('Found reusable MDX components', { count: outliers.size });

  try {
    await fs.unlink(OUTPUT_FILE);
    log.message('Deleted existing output file', { path: OUTPUT_FILE });
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }

  const project = new Project();
  const sourceFile = project.createSourceFile(OUTPUT_FILE, '', {
    overwrite: true,
  });

  sourceFile.addImportDeclaration({
    namedImports: ['jsx as _jsx'],
    moduleSpecifier: 'react/jsx-runtime',
  });

  const componentDocs = [...outliers]
    .map((tag) => {
      const filePath = mdxMap[tag];
      const relativePath = path
        .relative(process.cwd(), filePath)
        .replace(/\\/g, '/');
      return ` * @property {React.FC<any>} ${tag} Auto-generated component for MDX file. Source: [${tag}](${relativePath})`;
    })
    .join('\n');

  sourceFile.addStatements(`
/**
 * Map of auto-generated MDX components.
 * Keys are component names.
${componentDocs}
 * Values are React functional components rendering the corresponding MDX content as static HTML.
 *
 * @type {Record<string, React.FC<any>>}
 */
`);

  sourceFile.addVariableStatement({
    declarationKind: 'const' as const,
    declarations: [
      {
        name: 'mdxComponents',
        initializer: '{}',
        type: 'Record<string, React.FC<any>>',
      },
    ],
  });

  for (const tag of outliers) {
    const filePath = mdxMap[tag];
    const rawContent = await fs.readFile(filePath, 'utf8');

    const result = await evaluate({
      source: rawContent,
      components: {},
      options: {
        parseFrontmatter: true,
        mdxOptions: {
          baseUrl: pathToFileURL(filePath).toString(),
        },
      },
    });

    const html = ReactDOMServer.renderToStaticMarkup(result.content);

    const relativePath = path
      .relative(process.cwd(), filePath)
      .replace(/\\/g, '/');

    sourceFile.addStatements(`
/**
 * Auto-generated component for MDX file.
 * Source: [${tag}](${relativePath})
 * @param {any} props React props
 * @returns {JSX.Element}
 */`);

    sourceFile.addVariableStatement({
      declarationKind: 'const' as const,
      declarations: [
        {
          name: tag,
          type: 'React.FC<any>',
          initializer: (writer) => {
            writer.write(
              `(props: any): JSX.Element => _jsx('div', { dangerouslySetInnerHTML: { __html: ${JSON.stringify(
                html,
              )} }, ...props })`,
            );
          },
        },
      ],
    });

    sourceFile.addStatements(`mdxComponents["${tag}"] = ${tag};`);

    log.message(`✅ ${tag}: compiled and rendered`, { path: filePath });
  }

  sourceFile.addStatements(`export default mdxComponents;`);

  await sourceFile.save();

  log.message('✨ Wrote compiled components', { path: OUTPUT_FILE });
})();
