import fg from 'fast-glob';
import fs from 'fs/promises';
import path from 'path';

function keyify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const d = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[m][n];
}

async function main() {
  const metaPattern = 'src/content/**/**/*.metadata.json';
  const fullSizePattern = 'public/full-size/images/**/*.{png,jpg,jpeg,webp}';

  const metas = await fg(metaPattern, { dot: true });
  const fullFiles = await fg(fullSizePattern, { dot: true });

  const fullIndex = new Map();
  for (const f of fullFiles) {
    const bn = path.basename(f);
    const base = bn.replace(path.extname(bn), '');
    const k = keyify(base);
    const arr = fullIndex.get(k) || [];
    arr.push({ path: f, base, k });
    fullIndex.set(k, arr);
  }

  const results = { copied: [], skipped: [], missing: [] };

  for (const metaPath of metas) {
    try {
      const raw = await fs.readFile(metaPath, 'utf8');
      const meta = JSON.parse(raw);
      const dir = path.dirname(metaPath);
      const slug = path.basename(metaPath).replace('.metadata.json', '');
      const slugKey = keyify(slug);

      // build candidate list
      const candidates = new Set();

      // 1) explicit image field
      const imageField = meta.image || (meta.variants && meta.variants[0] && meta.variants[0].image) || null;
      if (imageField && typeof imageField === 'string') {
        const imgKey = keyify(path.basename(imageField).replace(path.extname(imageField), ''));
        if (fullIndex.has(imgKey)) fullIndex.get(imgKey).forEach(x => candidates.add(x.path));
      }

      // 2) slug exact
      if (fullIndex.has(slugKey)) fullIndex.get(slugKey).forEach(x => candidates.add(x.path));

      // 3) title-based
      if (meta.title && typeof meta.title === 'string') {
        const titleKey = keyify(meta.title);
        if (fullIndex.has(titleKey)) fullIndex.get(titleKey).forEach(x => candidates.add(x.path));
      }

      // 4) partial contains match (normalized)
      for (const [k, arr] of fullIndex) {
        if (k.includes(slugKey) || slugKey.includes(k)) {
          arr.forEach(x => candidates.add(x.path));
        }
      }

      // 5) fuzzy via levenshtein ratio
      if (candidates.size === 0) {
        let best = null;
        let bestScore = Infinity;
        for (const [k, arr] of fullIndex) {
          const dist = levenshtein(k, slugKey);
          const norm = dist / Math.max(k.length, slugKey.length || 1);
          if (norm < bestScore) {
            bestScore = norm;
            best = arr[0];
          }
        }
        if (best && bestScore < 0.4) {
          candidates.add(best.path);
        }
      }

      const candList = Array.from(candidates);
      if (candList.length === 0) {
        results.missing.push({ meta: metaPath, reason: 'no matching source image found' });
        continue;
      }

      const chosen = candList[0];
      const ext = path.extname(chosen) || '.png';
      const target = path.join(dir, `${slug}${ext}`);

      try {
        await fs.access(target);
        results.skipped.push({ meta: metaPath, target });
        continue;
      } catch {
        // not exist
      }

      await fs.copyFile(chosen, target);
      results.copied.push({ meta: metaPath, from: chosen, to: target });
    } catch (err) {
      results.missing.push({ meta: metaPath, reason: String(err) });
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error('ERROR', err);
  process.exit(1);
});
