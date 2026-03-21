/**
 * Reusable MDX Component Detector
 *
 * @fileoverview Analyzes MDX content files to identify reusable components,
 * builds a dependency tree, and compiles them in topological order into
 * a centralized TypeScript module.
 *
 * Requires the SCSS shim preload: --import ./scripts/utils/scssShim.ts
 *
 * @module findReusableMdxOutliers
 * @version 3.0.0
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

import { createLogger } from '@/lib/logging/logger';
import * as acorn from 'acorn';
import jsx from 'acorn-jsx';
import fs from 'fs/promises';
import path from 'path';
import React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import { Project } from 'ts-morph';
import { pathToFileURL } from 'url';

const log = createLogger({ script: 'findReusableMdxOutliers' });

/** @constant Path to generated components module */
const OUTPUT_FILE = path.join(
  process.cwd(),
  'src/lib/components/mdx/mdxComponents.tsx',
);

/** @constant Regex to strip intermediate suffixes before PascalCase conversion */
const INTERMEDIATE_SUFFIX = /\.(hidden|sheet)$/i;

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
 *
 * @param str - Input string
 * @returns PascalCase string
 */
const pascalCase = (str: string): string =>
  str
    .replace(/[-_]+/g, ' ')
    .replace(/(?:^|\s)(\w)/g, (_, c: string) => c.toUpperCase())
    .replace(/\s+/g, '');

/**
 * Derives the PascalCase component name from an MDX file path.
 *
 * @param filePath - Absolute path to the MDX file
 * @returns PascalCase component name
 */
const componentNameFromPath = (filePath: string): string =>
  pascalCase(path.basename(filePath, '.mdx').replace(INTERMEDIATE_SUFFIX, ''));

/**
 * Recursively walks the AST and extracts PascalCase component references.
 *
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
 * Extracts PascalCase component tags from compiled MDX JavaScript.
 *
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

/**
 * Performs a topological sort on the dependency graph using Kahn's algorithm.
 * Returns outlier names ordered so that dependencies compile before dependents.
 *
 * @param deps - Map of outlier name → set of outlier names it depends on
 * @returns Topologically sorted array of outlier names
 * @throws Error if a circular dependency is detected
 */
const topologicalSort = (deps: Map<string, Set<string>>): string[] => {
  const inDegree = new Map<string, number>();
  for (const name of deps.keys()) {
    inDegree.set(name, 0);
  }
  for (const [, edges] of deps) {
    for (const dep of edges) {
      if (inDegree.has(dep)) {
        inDegree.set(dep, (inDegree.get(dep) ?? 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [name, degree] of inDegree) {
    if (degree === 0) queue.push(name);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const dep of deps.get(current) ?? []) {
      if (!inDegree.has(dep)) continue;
      const newDegree = (inDegree.get(dep) ?? 1) - 1;
      inDegree.set(dep, newDegree);
      if (newDegree === 0) queue.push(dep);
    }
  }

  if (sorted.length !== deps.size) {
    const remaining = [...deps.keys()].filter((n) => !sorted.includes(n));
    throw new Error(
      `Circular dependency detected among: ${remaining.join(', ')}`,
    );
  }

  return sorted;
};

/**
 * Creates a React FC that renders pre-compiled HTML via dangerouslySetInnerHTML.
 * Used to inject already-compiled outlier HTML into dependent MDX evaluations.
 *
 * @param html - Pre-rendered HTML string
 * @returns React FC that renders the HTML
 */
const htmlComponent = (html: string): React.FC<Record<string, unknown>> => {
  const HtmlComp = () =>
    React.createElement('div', { dangerouslySetInnerHTML: { __html: html } });
  return HtmlComp;
};

(async () => {
  const { compile } = await import('@mdx-js/mdx');
  const { evaluate } = await import('next-mdx-remote-client/rsc');

  /** Ensure mdxComponents.tsx exists before importing index.tsx (which imports it) */
  try {
    await fs.access(OUTPUT_FILE);
  } catch {
    await fs.writeFile(OUTPUT_FILE, 'export default {};\n');
  }

  /** Import the real component map — SCSS handled by the scssShim preload */
  const { components } = await import('@/lib/components/mdx');

  const contentRoot = path.join(process.cwd(), 'src/content');
  const mdxFiles = await findMdxFiles(contentRoot);

  /**
   * Phase 1: Build filename → PascalCase map
   */
  const mdxMap: Record<string, string> = {};
  for (const file of mdxFiles) {
    mdxMap[componentNameFromPath(file)] = file;
  }

  /**
   * Phase 2: Scan every MDX file for PascalCase tags and identify outliers
   * (files whose PascalCase name is referenced as a JSX tag in another file).
   * Also record per-file tag sets for dependency resolution.
   */
  const outliers = new Set<string>();
  const tagsByFile = new Map<string, Set<string>>();

  for (const file of mdxFiles) {
    const rawContent = await fs.readFile(file, 'utf8');
    const compiled = await compile(rawContent, {
      jsx: true,
      outputFormat: 'program',
    });

    const tags = extractTags(String(compiled.value));
    tagsByFile.set(file, tags);

    for (const tag of tags) {
      if (mdxMap[tag]) {
        outliers.add(tag);
      }
    }
  }

  log.message('Phase 1-2: Identified reusable MDX components', {
    count: outliers.size,
    names: [...outliers].join(', '),
  });

  /**
   * Phase 3: Build dependency graph among outliers.
   * An edge from A → B means "A depends on B" (A's MDX references <B />).
   */
  const deps = new Map<string, Set<string>>();
  for (const name of outliers) {
    const filePath = mdxMap[name];
    const fileTags = tagsByFile.get(filePath) ?? new Set();
    const outlierDeps = new Set<string>();
    for (const tag of fileTags) {
      if (tag !== name && outliers.has(tag)) {
        outlierDeps.add(tag);
      }
    }
    deps.set(name, outlierDeps);
  }

  /**
   * Phase 4: Topological sort — leaves (no outlier deps) compile first.
   */
  const compileOrder = topologicalSort(deps);

  log.message('Phase 3-4: Dependency tree resolved', {
    order: compileOrder.join(' → '),
  });

  /**
   * Phase 5: Compile outliers in order and emit mdxComponents.tsx.
   * Uses the real app component map (Collapsible, FloatedContainer, etc.)
   * plus already-compiled outlier HTML for inter-outlier dependencies.
   */
  try {
    await fs.unlink(OUTPUT_FILE);
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

  const componentDocs = compileOrder
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

  /** Accumulates compiled HTML for outliers as they're processed */
  const compiledHtml = new Map<string, string>();

  for (const tag of compileOrder) {
    const filePath = mdxMap[tag];
    const rawContent = await fs.readFile(filePath, 'utf8');

    /** Real app components + already-compiled outlier HTML for deps */
    const componentMap: Record<string, React.FC<any>> = {
      ...components,
    };
    for (const [compiledName, html] of compiledHtml) {
      componentMap[compiledName] = htmlComponent(html);
    }

    const result = await evaluate({
      source: rawContent,
      components: componentMap,
      options: {
        parseFrontmatter: true,
        mdxOptions: {
          baseUrl: pathToFileURL(filePath).toString(),
        },
      },
    });

    const html = ReactDOMServer.renderToStaticMarkup(result.content);
    compiledHtml.set(tag, html);

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

    log.message(`✅ ${tag}: compiled and rendered`, {
      path: filePath,
      deps: [...(deps.get(tag) ?? [])].join(', ') || 'none',
    });
  }

  sourceFile.addStatements(`export default mdxComponents;`);

  await sourceFile.save();

  log.message('✨ Wrote compiled components', {
    path: OUTPUT_FILE,
    count: compileOrder.length,
  });
})();
