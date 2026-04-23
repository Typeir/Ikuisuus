import fg from 'fast-glob';
import fs from 'fs/promises';
import path from 'path';

function mdxSlug(file) {
  const base = path.basename(file);
  if (base.endsWith('.sheet.mdx')) return base.replace('.sheet.mdx', '');
  if (base.endsWith('.heirloom.mdx')) return base.replace('.heirloom.mdx', '');
  return base.replace(/\.mdx$/, '');
}

async function main() {
  const mdxPattern = 'src/content/en/**/**/*.mdx';
  const fullFiles = await fg('public/full-size/images/**/*.{png,jpg,jpeg,webp}', { dot: true });

  const index = new Map();
  for (const f of fullFiles) {
    const bn = path.basename(f);
    index.set(bn.toLowerCase(), f);
  }

  const mdxFiles = await fg(mdxPattern, { dot: true });
  const results = { copied: [], updated: [], missing: [] };

  for (const mdx of mdxFiles) {
    // only process monsters and heirlooms directories
    if (!/\/monsters\//.test(mdx) && !/\/heirlooms\//.test(mdx)) continue;

    let text = await fs.readFile(mdx, 'utf8');
    const slug = mdxSlug(mdx);
    const type = /\/monsters\//.test(mdx) ? 'monsters' : 'heirlooms';

    // find all src="..." occurrences
    const srcRegex = /src\s*=\s*["']([^"']+)["']/gi;
    let m;
    let changed = false;
    while ((m = srcRegex.exec(text)) !== null) {
      const orig = m[1];
      const bn = path.basename(orig).toLowerCase();
      // try exact basename match in full-size
      const found = index.get(bn);
      if (!found) continue;

      const ext = path.extname(found) || '.png';
      const targetDir = path.dirname(mdx);
      const targetPath = path.join(targetDir, `${slug}${ext}`);

      try {
        await fs.access(targetPath);
        // already exists — skip copying but still update src
      } catch {
        await fs.copyFile(found, targetPath);
        results.copied.push({ mdx, from: found, to: targetPath });
      }

      // update src in MDX to point to library path used by OG generator
      const newSrc = `/library/images/${type}/${slug}.webp`;
      text = text.slice(0, m.index) + m[0].replace(orig, newSrc) + text.slice(m.index + m[0].length);
      changed = true;
      results.updated.push({ mdx, newSrc });
    }

    if (changed) {
      await fs.writeFile(mdx, text, 'utf8');
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error('ERROR', err);
  process.exit(1);
});
