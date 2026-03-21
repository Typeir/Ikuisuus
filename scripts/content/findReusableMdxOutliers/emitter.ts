/**
 * MDX Components Emitter
 *
 * @fileoverview Generates the mdxComponents.tsx TypeScript module from compiled
 * outlier HTML using ts-morph. Each outlier becomes a React FC that renders
 * its pre-compiled HTML via dangerouslySetInnerHTML.
 *
 * @module findReusableMdxOutliers/emitter
 * @version 1.0.0
 * @since 3.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { Project } from 'ts-morph';

import type { CompiledOutlier } from './compiler';

/** @constant Path to generated components module */
export const OUTPUT_FILE = path.join(
  process.cwd(),
  'src/lib/components/mdx/mdxComponents.tsx',
);

/**
 * Ensures the output file exists so that index.tsx can import it.
 * Writes a minimal placeholder if missing.
 */
export const ensureOutputExists = async (): Promise<void> => {
  try {
    await fs.access(OUTPUT_FILE);
  } catch {
    await fs.writeFile(OUTPUT_FILE, 'export default {};\n');
  }
};

/**
 * Emits the mdxComponents.tsx file from compiled outlier data.
 *
 * @param results - Array of compiled outlier results in compile order
 * @returns Number of components written
 */
export const emitComponentsModule = async (
  results: CompiledOutlier[],
): Promise<number> => {
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

  const componentDocs = results
    .map((r) => {
      const relativePath = path
        .relative(process.cwd(), r.filePath)
        .replace(/\\/g, '/');
      return ` * @property {React.FC<any>} ${r.tag} Auto-generated component for MDX file. Source: [${r.tag}](${relativePath})`;
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

  for (const { tag, html, filePath } of results) {
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
  }

  sourceFile.addStatements(`export default mdxComponents;`);

  await sourceFile.save();

  return results.length;
};
