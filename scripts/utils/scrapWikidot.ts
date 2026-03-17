/**
 * @fileoverview Wikidot Scraper - Automated D&D metadata extraction
 * @description Scrapes data from dnd5e.wikidot.com lists and individual pages.
 *
 * @version 1.1.0
 * @since 1.0.0
 *
 * @example
 * ```bash
 * npx tsx scripts/utils/scrapWikidot.ts
 * ```
 */

import { createLogger } from '@/lib/logging/logger';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const log = createLogger({ script: 'scrapWikidot' });

const BASE_URL = 'http://dnd2024.wikidot.com';
const START_URL = `${BASE_URL}/#Classes`;
const OUTPUT_DIR = './src/content/en/character-creation/vocations';

const cleanAll = true;

const turndownService = new TurndownService();
turndownService.use(gfm);

/**
 * Returns a regex to match "/classname:subclass", skipping :main and :spell-list.
 *
 * @param className - The class prefix to match
 * @returns RegExp for subclass matching
 */
const makeClassSubclassRegex = (className: string): RegExp => {
  return new RegExp(`/${className}:(?!(main|spell-list)([#/]|$))([\\w-]+)`);
};

/**
 * Fixes broken tables with missing header pipes.
 *
 * @param mdx - Raw MDX content
 * @returns Fixed MDX content
 */
const fixTablePipes = (mdx: string): string => {
  return mdx.replace(
    /^(\|[^\n|]+)(\n\|[-\s|]+)$/gm,
    (_match, headerRow: string, separatorRow: string) => {
      const fixedHeader = headerRow.trim().endsWith('|')
        ? headerRow
        : headerRow.trim() + ' |';
      return `${fixedHeader}\n${separatorRow}`;
    },
  );
};

/**
 * Fixes external links — rewrites wikidot-style links to full URLs
 *
 * @param mdx - MDX content
 * @param className - Current class name
 * @returns Fixed MDX content
 */
const fixExternalLinks = (mdx: string, className: string): string => {
  let output = mdx.replace(
    /\(\(\s*(\/[^\):]+:[\w-]+)\s*\)\)/g,
    (match, link: string) => {
      if (
        new RegExp(`^/${className}:(?!main|spell-list)([\\w-]+)$`).test(link)
      ) {
        return match;
      } else {
        return `[${link}](${BASE_URL}${link})`;
      }
    },
  );

  output = output.replace(
    /\[([^\]]+)\]\((\/[^\)]+)\)/g,
    (match, text: string, link: string) => {
      if (
        new RegExp(`^/${className}:(?!main|spell-list)([\\w-]+)$`).test(link)
      ) {
        return match;
      } else {
        return `[${text}](${BASE_URL}${link})`;
      }
    },
  );

  return output;
};

/**
 * Fixes subclass links to use the site's URL format
 *
 * @param mdx - MDX content
 * @param className - Current class name
 * @returns Fixed MDX content
 */
const fixSubclassLinks = (mdx: string, className: string): string => {
  return mdx.replace(
    /\[([^\]]+)\]\((\/[^\)]+)\)/g,
    (match, text: string, link: string) => {
      const subclassMatch = link.match(new RegExp(`^/${className}:([\\w-]+)$`));
      if (subclassMatch) {
        const subclass = subclassMatch[1];
        const url = `/en/library/character-creation/vocations/${className}/${subclass}`;
        return `[${text}](${url})`;
      }
      return match;
    },
  );
};

/**
 * Cleans and transforms the MDX content.
 *
 * @param mdx - Raw MDX content
 * @param title - Page title
 * @param className - Class name
 * @returns Transformed MDX
 */
const transformMdx = (
  mdx: string,
  title: string,
  className: string,
): string => {
  let output = mdx;
  output = output.replace(/^Source: Player's Handbook\s*/i, '');
  output = `# ${title}\n\n${output}`;
  output = output.replace(
    /\(\(\s*(\/[^\):]+:[\w-]+)\s*\)\)/g,
    (match, link: string) => {
      if (
        new RegExp(`^/${className}:(?!main|spell-list)([\\w-]+)$`).test(link)
      ) {
        return match;
      } else {
        return `[${link}](${BASE_URL}${link})`;
      }
    },
  );
  output = fixExternalLinks(output, className);
  output = fixSubclassLinks(output, className);
  output = fixTablePipes(output);
  return output;
};

/**
 * Recursively deletes a directory.
 *
 * @param dirPath - Directory to delete
 */
const deleteFolderRecursive = (dirPath: string): void => {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
};

if (cleanAll && fs.existsSync(OUTPUT_DIR)) {
  log.message('Cleaning output directory', { path: OUTPUT_DIR });
  deleteFolderRecursive(OUTPUT_DIR);
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  log.message('Fetching class list', { url: START_URL });
  await page.goto(START_URL);

  const classLinks = await page.$$eval('#page-content a', (anchors) =>
    anchors.map((a) => a.href).filter((href) => /\/[a-z]+:main$/.test(href)),
  );

  for (const classMainUrl of classLinks) {
    const className = classMainUrl.split('/').pop()!.replace(':main', '');
    const visited = new Set<string>();

    try {
      log.message('Processing class', { className });

      await page.goto(classMainUrl);
      const content = await page.$eval('#page-content', (el) => el.innerHTML);

      const mdxRaw = turndownService.turndown(content);
      const mdx = transformMdx(
        mdxRaw,
        className.charAt(0).toUpperCase() + className.slice(1),
        className,
      );

      const filename = `main.mdx`;

      const classDir = path.join(OUTPUT_DIR, className);
      if (!fs.existsSync(classDir)) {
        fs.mkdirSync(classDir, { recursive: true });
      }

      const classFilePath = path.join(classDir, filename);
      if (!fs.existsSync(classFilePath)) {
        fs.writeFileSync(classFilePath, mdx, 'utf8');
      }

      visited.add(classMainUrl);

      const subClassLinks = (
        await page.$$eval('#page-content a', (el) => el.map((a) => a.href))
      ).filter((e) => makeClassSubclassRegex(className).exec(e));

      for (const subclassUrl of subClassLinks) {
        if (visited.has(subclassUrl)) continue;
        visited.add(subclassUrl);

        try {
          log.message('-> Specialization', { url: subclassUrl });
          await page.goto(subclassUrl);
          const subContent = await page.$eval(
            '#page-content',
            (el) => el.innerHTML,
          );
          const subMdxRaw = turndownService.turndown(subContent);

          const match = subclassUrl.match(
            new RegExp(`/${className}:([\\w-]+)`),
          );
          const subclassName = match ? match[1] : 'unknown-specialization';

          const finalMdx = transformMdx(
            subMdxRaw,
            subclassName
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase()),
            className,
          );

          const subDir = path.join(OUTPUT_DIR, className);
          if (!fs.existsSync(subDir)) {
            fs.mkdirSync(subDir, { recursive: true });
          }

          const subFilename = `${subclassName}.mdx`;
          const subFilePath = path.join(subDir, subFilename);

          if (!fs.existsSync(subFilePath)) {
            fs.writeFileSync(subFilePath, finalMdx, 'utf8');
          }
        } catch (subErr: unknown) {
          const msg = subErr instanceof Error ? subErr.message : String(subErr);
          log.warning('[Skipped] Failed to scrape subclass', {
            url: subclassUrl,
            error: msg,
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.warning('[Skipped] Failed to process', {
        url: classMainUrl,
        error: msg,
      });
    }
  }

  await browser.close();
  log.message('Done!');
})();
