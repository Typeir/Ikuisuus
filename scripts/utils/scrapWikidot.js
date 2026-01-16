const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = 'http://dnd2024.wikidot.com';
const START_URL = `${BASE_URL}/#Classes`;
const OUTPUT_DIR = './src/content/en/character-creation/vocations';

const cleanAll = true; // <<<<<<<<<<<<<<< Set this to true or false

const TurndownService = require('turndown');
const turndownPluginGfm = require('turndown-plugin-gfm');
const gfm = turndownPluginGfm.gfm;

const turndownService = new TurndownService();
turndownService.use(gfm);

/**
 * Returns a regex to match "/classname:subclass", skipping :main and :spell-list.
 * @param {string} className - The class prefix to match (e.g., "bard", "fighter")
 * @returns {RegExp}
 */
const makeClassSubclassRegex = (className) => {
  return new RegExp(`/${className}:(?!(main|spell-list)([#/]|$))([\\w-]+)`);
};

/**
 * Fixes broken tables with missing header pipes.
 */
const fixTablePipes = (mdx) => {
  return mdx.replace(
    /^(\|[^\n|]+)(\n\|[-\s|]+)$/gm,
    (match, headerRow, separatorRow) => {
      const fixedHeader = headerRow.trim().endsWith('|')
        ? headerRow
        : headerRow.trim() + ' |';
      return `${fixedHeader}\n${separatorRow}`;
    }
  );
};

const fixExternalLinks = (mdx, className) => {
  // Fix ((/link)) wikidot style
  let output = mdx.replace(
    /\(\(\s*(\/[^\):]+:[\w-]+)\s*\)\)/g,
    (match, link) => {
      if (
        new RegExp(`^/${className}:(?!main|spell-list)([\\w-]+)$`).test(link)
      ) {
        return match; // subclass, leave it alone
      } else {
        return `[${link}](${BASE_URL}${link})`;
      }
    }
  );

  // Fix standard markdown links
  output = output.replace(
    /\[([^\]]+)\]\((\/[^\)]+)\)/g,
    (match, text, link) => {
      if (
        new RegExp(`^/${className}:(?!main|spell-list)([\\w-]+)$`).test(link)
      ) {
        return match; // subclass, leave it alone
      } else {
        return `[${text}](${BASE_URL}${link})`;
      }
    }
  );

  return output;
};

const fixSubclassLinks = (mdx, className) => {
  return mdx.replace(/\[([^\]]+)\]\((\/[^\)]+)\)/g, (match, text, link) => {
    const subclassMatch = link.match(new RegExp(`^/${className}:([\\w-]+)$`));
    if (subclassMatch) {
      const subclass = subclassMatch[1];
      const url = `/en/library/character-creation/vocations/${className}/${subclass}`;
      return `[${text}](${url})`;
    }
    return match; // Leave other links as is
  });
};

/**
 * Cleans and transforms the MDX content.
 */
const transformMdx = (mdx, title, className) => {
  let output = mdx;

  // Remove "Source: Player's Handbook"
  output = output.replace(/^Source: Player's Handbook\s*/i, '');

  // Insert # Header
  output = `# ${title}\n\n${output}`;

  // Fix wikidot-style links
  output = output.replace(
    /\(\(\s*(\/[^\):]+:[\w-]+)\s*\)\)/g,
    (match, link) => {
      if (
        new RegExp(`^/${className}:(?!main|spell-list)([\\w-]+)$`).test(link)
      ) {
        return match; // Leave subclass links alone
      } else {
        return `[${link}](${BASE_URL}${link})`;
      }
    }
  );

  // Fix links to Wikidot temporarily
  output = fixExternalLinks(output, className);

  // Fix subclass links to site format
  output = fixSubclassLinks(output, className);

  // Fix tables
  output = fixTablePipes(output);

  return output;
};

/**
 * Recursively deletes a directory.
 */
const deleteFolderRecursive = (dirPath) => {
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

// Handle cleanAll
if (cleanAll && fs.existsSync(OUTPUT_DIR)) {
  console.log(`Cleaning output directory: ${OUTPUT_DIR}`);
  deleteFolderRecursive(OUTPUT_DIR);
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log(`Fetching class list from ${START_URL}`);
  await page.goto(START_URL);

  const classLinks = await page.$$eval('#page-content a', (anchors) =>
    anchors.map((a) => a.href).filter((href) => /\/[a-z]+:main$/.test(href))
  );

  for (const classMainUrl of classLinks) {
    const className = classMainUrl.split('/').pop().replace(':main', '');
    const visited = new Set();

    try {
      console.log(`Processing class: ${className}`);

      await page.goto(classMainUrl);
      const content = await page.$eval('#page-content', (el) => el.innerHTML);

      const mdxRaw = turndownService.turndown(content);
      const mdx = transformMdx(
        mdxRaw,
        className.charAt(0).toUpperCase() + className.slice(1),
        className
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
        await page.$$eval('#page-content a', (el) => el.map((el) => el.href))
      ).filter((e) => makeClassSubclassRegex(className).exec(e));

      for (const subclassUrl of subClassLinks) {
        if (visited.has(subclassUrl)) continue;
        visited.add(subclassUrl);

        try {
          console.log(`  -> Specialization: ${subclassUrl}`);
          await page.goto(subclassUrl);
          const subContent = await page.$eval(
            '#page-content',
            (el) => el.innerHTML
          );
          const subMdxRaw = turndownService.turndown(subContent);

          const match = subclassUrl.match(
            new RegExp(`/${className}:([\\w-]+)`)
          );
          const subclassName = match ? match[1] : 'unknown-specialization';

          const finalMdx = transformMdx(
            subMdxRaw,
            subclassName
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase()),
            className
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
        } catch (subErr) {
          console.warn(
            `    [Skipped] Failed to scrape subclass at ${subclassUrl}: ${subErr.message}`
          );
        }
      }
    } catch (err) {
      console.warn(
        `[Skipped] Failed to process ${classMainUrl}: ${err.message}`
      );
    }
  }

  await browser.close();
  console.log('Done!');
})();
