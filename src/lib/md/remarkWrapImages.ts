import type { Html, Image } from 'mdast';
import type { Plugin } from 'unified';
import type { Parent } from 'unist';
import { visit } from 'unist-util-visit';

/**
 * A remark plugin factory that wraps all Markdown image nodes in a <div> with a custom class.
 *
 * @param {string} [className='vignette-img'] - The CSS class(es) to apply to the wrapping <div>.
 * @returns {Plugin<[], any>} A remark plugin that replaces image nodes with HTML-wrapped versions.
 */
const remarkWrapImages = (
  className: string = 'vignette-img'
): Plugin<[], any> => {
  return () => {
    return (tree) => {
      visit(tree, 'image', (node: Image, index, parent) => {
        if (!parent || typeof index !== 'number') return;

        const alt = node.alt?.replace(/"/g, '&quot;') ?? '';
        const src = node.url.replace(/"/g, '&quot;');

        const htmlWrapper: Html = {
          type: 'html',
          value: `<div class="${className}"><img src="${src}" alt="${alt}" /></div>`,
        };

        (parent as Parent).children.splice(index, 1, htmlWrapper);
      });
    };
  };
};

export default remarkWrapImages;
