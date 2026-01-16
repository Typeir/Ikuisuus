import { renderMarkdownToHtml } from "@/lib/md/renderMarkdownToHtml";
import matter from "gray-matter";
import styles from "../page.module.scss";

/**
 * Renders a raw Markdown page as static HTML.
 *
 * @param {object} params - The render parameters.
 * @param {string} params.slugPath - The content slug (joined path).
 * @param {string} params.rawContent - The raw Markdown file content.
 * @returns {Promise<JSX.Element>} - The rendered HTML page.
 */
export const MDRawPage = async ({
  slugPath,
  rawContent,
}: {
  slugPath: string;
  rawContent: string;
}) => {
  const { content, data } = matter(rawContent);
  const htmlContent = await renderMarkdownToHtml(content);

  return (
    <div className="prose prose-invert mx-auto">
      <h1 className="text-4xl font-mono font-black mb-6">
        {data.title ?? slugPath}
      </h1>
      <article
        className={styles.markdown}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};
