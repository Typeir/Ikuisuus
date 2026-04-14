/**
 * @fileoverview Monster Feature Metadata Generator
 * @description Reads `.sheet.mdx` monster files, classifies sections, extracts
 * MonsterFeature records via the extraction pipeline, and appends a `features`
 * subsection to each record in the existing `.metadata.json` files.
 * Runs after the main metadata generator.
 *
 * @module scripts/metadata/generateFeatureMetadata
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import type { MonsterFeature } from '@/lib/types/feature';
import fs from 'fs/promises';
import path from 'path';
import {
  endTimer,
  filePathToSlug,
  getMatchingFiles,
  readLines,
  runWithCli,
  safeWriteFile,
  startTimer,
} from '.';
import { findMetaForFeature, parseMetaTags } from './extraction/metaTagParser';
import {
  extractDeedActs,
  extractDeedLair,
  extractDeedPhases,
  extractDeedStratagems,
} from './extraction/monsterDeedExtractor';
import {
  extractActions,
  extractSpellcasting,
  extractTraits,
} from './extraction/monsterFeatureExtractor';
import { featureId } from './extraction/monsterMultiattackExtractor';
import {
  classifySections,
  type MonsterSection,
} from './extraction/monsterSectionClassifier';

const log = createLogger({ component: 'FeatureMetadataGenerator' });

/**
 * Maps a classified section to an extraction function.
 *
 * @param {MonsterSection} section - Classified section
 * @returns {MonsterFeature[]} Extracted features from this section
 */
function extractFeaturesFromSection(section: MonsterSection): MonsterFeature[] {
  switch (section.type) {
    case 'traits':
      return extractTraits(section);
    case 'actions':
      return extractActions(section, 'action');
    case 'bonus_actions':
      return extractActions(section, 'bonus_action');
    case 'reactions':
      return extractActions(section, 'reaction');
    case 'deed_act':
      return extractDeedActs(section);
    case 'deed_stratagem':
      return extractDeedStratagems(section);
    case 'deed_lair':
      return extractDeedLair(section);
    case 'deed_phase':
      return extractDeedPhases(section);
    case 'spellcasting': {
      const spell = extractSpellcasting(section);
      return spell ? [spell] : [];
    }
    case 'bloodrage':
      return extractActions(section, 'bonus_action');
    default:
      return [];
  }
}

/**
 * Resolves multiattack_refs on features that have a multiattack token.
 * Matches attack names from the multiattack description to child feature IDs
 * by normalized name comparison.
 *
 * @param {MonsterFeature[]} features - All extracted features for one monster
 * @param {string} slug - Monster slug for ID generation
 */
function resolveMultiattackRefs(
  features: MonsterFeature[],
  slug: string,
): void {
  for (const feat of features) {
    if (!feat.multiattack) continue;
    const refs: { id: string; count: number }[] = [];
    for (const atk of feat.multiattack.attacks) {
      const matchedFeat = features.find(
        (f) =>
          f.id !== feat.id &&
          f.name.toLowerCase().includes(atk.name.toLowerCase()),
      );
      if (matchedFeat) {
        refs.push({ id: matchedFeat.id, count: atk.count });
      } else {
        refs.push({ id: featureId(slug, atk.name), count: atk.count });
      }
    }
    if (refs.length > 0) feat.multiattack_refs = refs;
  }
}

/**
 * Extracts all features from a monster .sheet.mdx file.
 *
 * @param {string} filePath - Absolute path to the .sheet.mdx file
 * @returns {Promise<MonsterFeature[]>} Array of extracted features
 */
export async function parseMonsterFeatures(
  filePath: string,
): Promise<MonsterFeature[]> {
  const raw = await fs.readFile(filePath, 'utf8');
  const lines = readLines(raw);
  const slug = filePathToSlug(filePath, /\.sheet\.mdx$/i);

  const sections = classifySections(lines);

  const features: MonsterFeature[] = [];
  for (const section of sections) {
    const extracted = extractFeaturesFromSection(section);
    for (const feat of extracted) {
      feat.id = featureId(slug, feat.name);
      features.push(feat);
    }
  }

  resolveMultiattackRefs(features, slug);

  const metaDirectives = parseMetaTags(raw);
  if (metaDirectives.length > 0) {
    for (const feat of features) {
      const meta = findMetaForFeature(metaDirectives, feat.id);
      if (meta) {
        feat.meta = meta.attrs;
      }
    }
  }

  return features;
}

/**
 * Appends features to all monster .metadata.json files.
 * Reads existing metadata, finds the corresponding .sheet.mdx, extracts
 * features, and writes the features subsection into each metadata record.
 *
 * @param {object} [options] - Optional configuration
 * @param {string} [options.contentDir] - Override content directory
 * @param {string} [options.fileFilter] - Filter to a single .sheet.mdx filename
 * @returns {Promise<void>}
 */
async function main(
  options: { contentDir?: string; fileFilter?: string } = {},
): Promise<void> {
  const timerKey = 'feature-metadata-append';
  startTimer(timerKey);

  const contentDir =
    options.contentDir ||
    path.resolve(__dirname, '..', '..', 'src', 'content', 'en', 'monsters');

  let metadataFiles = await getMatchingFiles(contentDir, /\.metadata\.json$/);

  if (options.fileFilter) {
    const sheetName = options.fileFilter.replace(/\.sheet\.mdx$/i, '');
    metadataFiles = metadataFiles.filter((f) =>
      path.basename(f).startsWith(sheetName),
    );
    log.message(
      `Filtered to ${metadataFiles.length} metadata file(s) matching "${options.fileFilter}"`,
    );
  }

  log.message(`Found ${metadataFiles.length} metadata files to enrich`);

  let totalFeatures = 0;
  let filesUpdated = 0;

  const results = await Promise.allSettled(
    metadataFiles.map(async (metaPath) => {
      const sheetPath = metaPath.replace(/\.metadata\.json$/, '.sheet.mdx');

      try {
        await fs.access(sheetPath);
      } catch {
        log.debug('No .sheet.mdx found for metadata file', { metaPath });
        return;
      }

      const metaRaw = await fs.readFile(metaPath, 'utf8');
      const metadata = JSON.parse(metaRaw);
      const features = await parseMonsterFeatures(sheetPath);
      totalFeatures += features.length;

      if (Array.isArray(metadata)) {
        for (const record of metadata) {
          record.features = features;
        }
      } else {
        metadata.features = features;
      }

      await safeWriteFile(metaPath, JSON.stringify(metadata, null, 2));
      filesUpdated++;
    }),
  );

  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length > 0) {
    for (const f of failures) {
      log.error('Feature extraction failed', {
        error: (f as PromiseRejectedResult).reason,
      });
    }
  }

  log.message(
    `✅ Appended ${totalFeatures} features to ${filesUpdated} metadata files`,
  );
  endTimer(timerKey);
}

const isDirectRun =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectRun) {
  runWithCli(main).catch((error: any) => {
    log.error('Fatal error during feature metadata generation', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  });
}

export { main };

