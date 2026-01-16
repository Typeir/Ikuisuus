import { remark } from 'remark';
import gfm from 'remark-gfm';
import html from 'remark-html';

/**
 * Converts raw Markdown content to HTML using `remark`.
 * Supports GitHub-flavored markdown extensions.
 *
 * @param {string} markdown - The raw Markdown content to convert.
 * @returns {Promise<string>} - The rendered HTML string.
 */
export const renderMarkdownToHtml = async (
  markdown: string
): Promise<string> => {
  const processedContent = await remark().use(gfm).use(html).process(markdown);

  return processedContent.toString();
};
