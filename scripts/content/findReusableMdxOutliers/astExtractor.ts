/**
 * JSX AST Tag Extractor
 *
 * @fileoverview Parses compiled MDX JavaScript and extracts PascalCase
 * component references using acorn with JSX support.
 *
 * @module findReusableMdxOutliers/astExtractor
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import * as acorn from 'acorn';
import jsx from 'acorn-jsx';

/**
 * Recursively walks the AST and extracts PascalCase component references.
 *
 * @param {any} node - AST node
 * @param {Set<string>} tags - Set to collect component tag names
 * @returns {void}
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
 * @param {string} compiledJs - Compiled MDX JavaScript source
 * @returns {Set<string>} Set of component tag names
 */
export const extractTags = (compiledJs: string): Set<string> => {
  const Parser = acorn.Parser.extend(jsx());
  const ast = Parser.parse(compiledJs, {
    ecmaVersion: 'latest',
    sourceType: 'module',
  });

  const tags = new Set<string>();
  visitAst(ast, tags);
  return tags;
};
