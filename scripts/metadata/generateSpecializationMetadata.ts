/**
 * @fileoverview Specialization Metadata Generator
 * @description Parses `.specialization.mdx` files and extracts title, flavor,
 * vocation, specialization type, features, optional always-prepared spell
 * tables, and optional spellcasting progression data.
 *
 * @module scripts/metadata/generateSpecializationMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import { promises as fs } from 'fs';
import matter from 'gray-matter';
import { parentVocationOf, unslotVocation } from './vocationForms';
import path from 'path';
import {
    applyAuthoredFeatureAspects,
  stampAnchors,
    blankFrontmatter,
    extractAllTags,
    filePathToSlug,
    findTitleIndex,
    parseDescription,
    parseTitle,
    runGenerator,
    runWithCli,
    type SharedData,
    type StorageAdapter,
} from '.';
import { extractFeatureGrants } from './extraction/grantsExtractor';
import { tagRangedFeatures, type RangedFeature } from './featureAspects';
import { SLUG, TEXT } from './parsingPatterns';
import { FLAVOR, SPECIALIZATION_TYPES } from './vocationPatterns';
import {
    parseAlwaysPreparedSpells,
    parseFeatures,
    parseSpecializationSpellcasting,
} from './specializationParsers';

const log = createLogger({ component: 'SpecializationMetadataGenerator' });

/**
 * Determines the specialization type from the title text.
 *
 * @param {string} title - Specialization title
 * @returns {string} Matched type or "Subclass"
 */
function classifySpecializationType(title: string): string {
  for (const { pattern, type } of SPECIALIZATION_TYPES) {
    if (pattern.test(title)) return type;
  }
  return 'Subclass';
}

/**
 * Extracts the italic flavor line below the H1 title.
 *
 * @param {string[]} lines - File lines
 * @returns {string | undefined} Flavor text without underscores
 */
function parseFlavor(lines: string[]): string | undefined {
  const start = Math.max(findTitleIndex(lines), 0);
  for (let i = start; i < Math.min(lines.length, start + 10); i++) {
    const trimmed = lines[i].trim();
    if (
      FLAVOR.underscoreItalic.test(trimmed) ||
      FLAVOR.asteriskItalic.test(trimmed)
    ) {
      return trimmed.replace(TEXT.italicWrap, '').trim();
    }
  }
  return undefined;
}

/**
 * Parses a single specialization MDX file into metadata.
 *
 * @param {string} filePath - Absolute path to the .specialization.mdx file
 * @param {SharedData} sharedData - Shared game data constants
 * @returns {Promise<Record<string, unknown> | null>} Parsed metadata or null
 */
async function parseSpecializationFile(
  filePath: string,
  sharedData: SharedData,
): Promise<Record<string, unknown> | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const body = unslotVocation(blankFrontmatter(raw));
    const lines = body.split(TEXT.lineSplit).map((l) => l.trim());
    const title = parseTitle(lines);
    const slug = filePathToSlug(filePath);

    const parentDir = path.basename(path.dirname(filePath));
    const vocation = parentVocationOf(blankFrontmatter(raw)) ?? parentDir;

    const specializationType = classifySpecializationType(title);
    const flavor = parseFlavor(lines);
    const description = parseDescription(body);
    const features = parseFeatures(body);
    const rawLines = body.split(TEXT.lineSplit);
    const specFrontmatter = matter(raw).data as Record<string, unknown>;
    const specGrantsRaw = specFrontmatter.grants ?? specFrontmatter.Grants;
    const specGrantsMap =
      specGrantsRaw && !Array.isArray(specGrantsRaw) && typeof specGrantsRaw === 'object'
        ? (specGrantsRaw as Record<string, string[]>)
        : undefined;
    const featuresWithGrants = features.map((f) => {
      const prose = rawLines.slice(f.startLine - 1, f.endLine).join('\n');
      const grants = extractFeatureGrants(f.name, prose, specGrantsMap);
      return grants.length > 0 ? { ...f, grants } : f;
    });

    tagRangedFeatures(
      featuresWithGrants as RangedFeature[],
      rawLines,
      sharedData,
    );
    stampAnchors(featuresWithGrants as Array<{ name?: string; heading?: string }>);
    applyAuthoredFeatureAspects(
      featuresWithGrants as Array<{ name?: string; heading?: string; tags?: string[] }>,
      matter(raw).data as Record<string, unknown>,
    );
    const preparedSpells = parseAlwaysPreparedSpells(body);
    const spellcasting = parseSpecializationSpellcasting(body);

    const file = path
      .relative(process.cwd(), filePath)
      .replace(SLUG.pathBackslash, '/');
    const link = `/library/character-creation/vocations/${vocation}/${slug}`;

    const tags = new Set<string>();
    tags.add(`vocation:${vocation}`);
    tags.add(`specialization:${specializationType.toLowerCase()}`);

    if (spellcasting) {
      tags.add(`spellcasting:${spellcasting.progression.toLowerCase()}`);
      tags.add(`spellcasting-ability:${spellcasting.ability.toLowerCase()}`);
    }

    if (preparedSpells) {
      tags.add('mechanic:always-prepared-spells');
    }

    const contentTags = extractAllTags(raw, filePath, sharedData);
    for (const tag of contentTags) {
      tags.add(tag);
    }

    const metadata: Record<string, unknown> = {
      slug,
      title,
      file,
      link,
      vocation,
      specializationType,
      flavor,
      spellcasting,
      preparedSpells,
      features: featuresWithGrants,
      tags: [...tags].sort(),
      indexVersion: 1,
    };

    if (description) {
      metadata.description = description;
    }

    log.message(`✅ Parsed specialization: ${title} (${vocation}/${slug})`, {
      features: features.length,
      type: specializationType,
      hasSpellcasting: !!spellcasting,
    });

    return metadata;
  } catch (error) {
    log.error(`Failed to parse ${filePath}`, {
      error: (error as Error).message,
    });
    return null;
  }
}

/**
 * Main entry point for specialization metadata generation.
 *
 * @param {object} [options] - Configuration
 * @param {string} [options.contentDir] - Override content directory
 * @param {RegExp} [options.filePattern] - Override file pattern
 * @param {StorageAdapter} [options.storage] - Optional DB storage
 * @returns {Promise<void>}
 */
async function main(
  options: {
    contentDir?: string;
    filePattern?: RegExp;
    storage?: StorageAdapter;
  } = {},
): Promise<void> {
  await runGenerator({
    name: 'Specialization Metadata Generator',
    contentType: 'specializations',
    filePattern: options.filePattern || /\.specialization\.mdx$/,
    parseFile: parseSpecializationFile,
    recursive: true,
    processResult: (result: any) => {
      if (result === null) return { metadata: null, count: 0 };
      return { metadata: result, count: 1 };
    },
    contentDir: options.contentDir,
    storage: options.storage,
    metadataVersion: '1.0.0',
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWithCli(main).catch((error: any) => {
    log.error('Fatal error during specialization metadata generation', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  });
}

export { main, parseSpecializationFile };

