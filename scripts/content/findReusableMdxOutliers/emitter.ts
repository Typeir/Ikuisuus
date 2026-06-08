/**
 * MDX Components Emitter
 *
 * @fileoverview Generates the mdxComponents.tsx TypeScript module from compiled
 * outlier HTML using ts-morph. Each outlier becomes a React FC that renders
 * its pre-compiled HTML via dangerouslySetInnerHTML.
 *
 * @module findReusableMdxOutliers/emitter
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { Project, VariableDeclarationKind } from 'ts-morph';

import type { CompiledOutlier } from './compiler';

/** @constant Path to generated components module */
export const OUTPUT_FILE = path.join(
  process.cwd(),
  'src/modules/library/infrastructure/compile/mdxComponents.tsx',
);

/**
 * Canonical file-level JSDoc header for generated mdxComponents.tsx.
 */
const GENERATED_FILE_HEADER = `/**
 * @fileoverview Auto-generated MDX component registry used by the MDX runtime.
 * @module src/modules/library/infrastructure/compile/mdxComponents
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
/* paw:gate:* ignore */`;

/**
 * CI placeholder module content for mdxComponents.tsx.
 *
 * @returns Placeholder module source
 */
export const createCiPlaceholderModule = (): string => `/**
 * @fileoverview Auto-generated MDX component registry used by the MDX runtime.
 * @description Minimal placeholder generated during CI builds.
 * In development, run: npm run find-reusable-mdx-outliers.
 * @module src/modules/library/infrastructure/compile/mdxComponents
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

/* paw:gate:* ignore */

export const mdxComponents = {};
export default mdxComponents;
`;

/**
 * Ensures the mdxComponents output directory exists.
 */
export const ensureOutputDirectoryExists = async (): Promise<void> => {
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
};

/**
 * Ensures the output file exists so that index.tsx can import it.
 * Writes a minimal placeholder if missing.
 */
export const ensureOutputExists = async (): Promise<void> => {
  await ensureOutputDirectoryExists();
  try {
    await fs.access(OUTPUT_FILE);
  } catch {
    await fs.writeFile(OUTPUT_FILE, createCiPlaceholderModule(), 'utf-8');
  }
};

/**
 * Writes the CI placeholder mdxComponents.tsx module.
 */
export const writeCiPlaceholderModule = async (): Promise<void> => {
  await ensureOutputDirectoryExists();
  await fs.writeFile(OUTPUT_FILE, createCiPlaceholderModule(), 'utf-8');
};

/**
 * Emits the mdxComponents.tsx file from compiled outlier data.
 *
 * @param {CompiledOutlier[]} results - Array of compiled outlier results in compile order
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

  sourceFile.addStatements(GENERATED_FILE_HEADER);

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
    declarationKind: VariableDeclarationKind.Const,
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
      declarationKind: VariableDeclarationKind.Const,
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
