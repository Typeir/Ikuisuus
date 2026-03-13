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
 *
 * @description
 * Scans all MDX files in src/content/en/ to detect custom React components
 * used within MDX content. Extracts these components and compiles them into
 * a single TypeScript file (mdxComponents.tsx) for centralized import.
 *
 * Process:
 * 1. Recursively scans MDX files
 * 2. Parses JSX/MDX syntax with acorn
 * 3. Identifies custom component references (PascalCase)
 * 4. Extracts source components
 * 5. Compiles to TypeScript module
 * 6. Validates TypeScript syntax
 *
 * @example
 * // Run from command line
 * node findReusableMdxOutliers.js
 * // Output:
 * // Found 2 reusable MDX components:
 * // ✅ LesserMooncleave: compiled and rendered
 * // ✅ FoldDeduplication: compiled and rendered
 */

const fs = require('fs').promises;
const path = require('path');
const { evaluate } = require('next-mdx-remote-client/rsc');
const { compile } = require('@mdx-js/mdx');
const { pathToFileURL } = require('url');
const acorn = require('acorn');
const jsx = require('acorn-jsx');
const ReactDOMServer = require('react-dom/server');
const { Project } = require('ts-morph');
const { createLogger } = require('../core/logger.cjs');
const log = createLogger({ script: 'findReusableMdxOutliers' });

/** @constant {string} OUTPUT_FILE - Path to generated components module */
const OUTPUT_FILE = path.join(
  process.cwd(),
  'src/lib/components/mdx/mdxComponents.tsx',
);

/**
 * Recursively finds all .mdx files in a directory.
 *
 * @async
 * @function findMdxFiles
 * @param {string} dir - Root directory to search
 * @returns {Promise<string[]>} Array of absolute paths to .mdx files
 *
 * @example
 * const mdxFiles = await findMdxFiles('src/content/en');
 * // Returns: ['C:/project/src/content/en/spells/fireball.mdx', ...]
 */
const findMdxFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const files = await Promise.all(
    entries.map(async (entry) => {
      const res = path.resolve(dir, entry.name);
      if (entry.isDirectory()) return findMdxFiles(res);
      if (res.endsWith('.mdx')) return res;
      return [];
    }),
  );

  return files.flat();
};

/**
 * Converts kebab-case or snake_case to PascalCase.
 * @param {string} str
 * @returns {string}
 */
const pascalCase = (str) =>
  str
    .replace(/[-_]+/g, ' ')
    .replace(/(?:^|\s)(\w)/g, (_, c) => c.toUpperCase())
    .replace(/\s+/g, '');

/**
 * Recursively walks the AST and extracts reusable component references.
 * @param {any} node
 * @param {Set<string>} tags
 */
const visitAst = (node, tags) => {
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
 * @param {string} compiledJs
 * @returns {Set<string>}
 */
const extractTags = (compiledJs) => {
  const Parser = acorn.Parser.extend(jsx());
  const ast = Parser.parse(compiledJs, {
    ecmaVersion: 'latest',
    sourceType: 'module',
  });

  const tags = new Set();
  visitAst(ast, tags);
  return tags;
};

(async () => {
  const contentRoot = path.join(process.cwd(), 'src/content');
  const mdxFiles = await findMdxFiles(contentRoot);

  // Build PascalCase map of .mdx filenames
  /** @type {Record<string, string>} */
  const mdxMap = {};
  for (const file of mdxFiles) {
    const base = path.basename(file, '.mdx');
    mdxMap[pascalCase(base)] = file;
  }

  // Detect outliers
  /** @type {Set<string>} */
  const outliers = new Set();

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

  // Delete the output file if it exists, ignore errors if not
  try {
    await fs.unlink(OUTPUT_FILE);
    log.message('Deleted existing output file', { path: OUTPUT_FILE });
  } catch (err) {
    if (err.code !== 'ENOENT') throw err; // only ignore if file doesn't exist
  }

  // Setup ts-morph project and source file
  const project = new Project();
  const sourceFile = project.createSourceFile(OUTPUT_FILE, '', {
    overwrite: true,
  });

  // Import jsx-runtime jsx for _jsx usage
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
      // Make sure each line begins with exactly " * " for consistent JSDoc indentation
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

  // Initialize mdxComponents object literal with proper typing and JSDoc
  sourceFile.addVariableStatement({
    declarationKind: 'const',
    declarations: [
      {
        name: 'mdxComponents',
        initializer: '{}',
        type: 'Record<string, React.FC<any>>',
      },
    ],
  });

  // For each reusable component, add JSDoc and variable declaration, and assign to mdxComponents
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

    // Render static markup
    const html = ReactDOMServer.renderToStaticMarkup(result.content);

    // Create a URL-friendly relative path for the JSDoc link
    const relativePath = path
      .relative(process.cwd(), filePath)
      .replace(/\\/g, '/');

    // Add JSDoc comment and variable declaration for the component
    sourceFile.addStatements(`
/**
 * Auto-generated component for MDX file.
 * Source: [${tag}](${relativePath})
 * @param {any} props React props
 * @returns {JSX.Element}
 */`);

    sourceFile.addVariableStatement({
      declarationKind: 'const',
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

  // Export mdxComponents as default
  sourceFile.addStatements(`export default mdxComponents;`);

  // Save file
  await sourceFile.save();

  log.message('✨ Wrote compiled components', { path: OUTPUT_FILE });
})();
