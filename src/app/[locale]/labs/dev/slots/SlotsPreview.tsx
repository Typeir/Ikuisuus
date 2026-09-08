/**
 * @fileoverview Slot card fixture preview.
 * @description Renders the heirloom fixture through the real wiki article
 * frame so the card can be eyeballed against the live article while the slot
 * components are worked on.
 *
 * @module app/[locale]/labs/dev/slots/SlotsPreview
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-03
 */

import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { ArticleMetadataProvider } from '@/modules/library/application/context/ArticleMetadataContext';
import {
  aspectIndexOf,
  loadArticleMetadata,
} from '@/modules/library/application/use-cases/loadArticleMetadata';
import { compileStatic } from '@/modules/library/infrastructure/compile/compileStatic';
import enrichedComponents from '@/modules/library/presentation/components';
import {
  HashNavigationProvider,
  SectionTrack,
} from '@/modules/library/presentation/components';
import { slotComponents } from '@/modules/library/presentation/components/slots';
import { KeywordShardProvider } from '@/modules/library/presentation/components/Keyword/KeywordShardContext';
import { LibraryArticle } from '@/modules/library/presentation/LibraryArticle';
import { resolveStreamText } from '@/modules/library/presentation/components/utils';

/**
 * The production article each fixture borrows its frame from — metadata,
 * aspects
 */
const FRAME_ARTICLES: Readonly<Record<string, readonly string[]>> = {
  'alfanjon.mdx': ['items', 'heirlooms', 'alfanjon-of-the-crescent-moon'],
  'spell.mdx': ['spells', 'magic-missile'],
  'spell-overcast.mdx': ['spells', 'imbue-weapon'],
  'trinket.mdx': ['items', 'trinkets', 'potion-of-healing'],
  'monster.mdx': ['monsters', 'rotworm'],
  'monster-deeds.mdx': ['monsters', 'tombsteel-wizard-construct'],
  'vocation.mdx': ['character-creation', 'vocations', 'monk', 'monk'],
  'feat.mdx': ['character-creation', 'feats', 'chef'],
};

/**
 * Fixture path.
 */
export const FIXTURE = path.resolve('tests/fixtures/slots', 'alfanjon.mdx');

/**
 * Content-v2 fixtures, one per card host, in reading order.
 */
export const CONTENT_V2_FIXTURES = [
  'spell.mdx',
  'spell-overcast.mdx',
  'trinket.mdx',
  'monster.mdx',
  'vocation.mdx',
  'feat.mdx',
] as const;

/**
 * Fixture directory.
 */
const FIXTURE_DIR = path.resolve('tests/fixtures/slots');

/**
 * Renders the heirloom fixture inside the article frame.
 *
 * @param {object} [props] - Component props
 * @param {string} [props.fixture] - Fixture file name to render
 * @returns {Promise<React.ReactElement>} Rendered fixture, or a notice when
 * the fixture did not ship
 */
export async function SlotsPreview({
  fixture = 'alfanjon.mdx',
}: {
  fixture?: string;
} = {}): Promise<React.ReactElement> {
  const file = path.join(FIXTURE_DIR, fixture);
  if (!existsSync(file)) {
    return (
      <p data-slots-preview-unavailable>
        The slot fixture is not part of this deployment. Run the site locally
        to preview it.
      </p>
    );
  }

  const source = readFileSync(file, 'utf8');
  const articleSlug = [
    ...(FRAME_ARTICLES[fixture] ?? FRAME_ARTICLES['alfanjon.mdx']),
  ];

  const streamText = await resolveStreamText('en', articleSlug, source);
  const articleMetadata = await loadArticleMetadata(articleSlug, 'en');

  const result = await compileStatic({
    source,
    components: { ...enrichedComponents, ...slotComponents },
    baseUrl: pathToFileURL(file).toString(),
    aspects: aspectIndexOf(articleMetadata),
    locale: 'en',
  });

  return (
    <>
      <HashNavigationProvider />
      <SectionTrack />
      <ArticleMetadataProvider metadata={articleMetadata}>
        <LibraryArticle streamText={streamText}>
          <KeywordShardProvider shards={result.shards ?? []}>
            {result.content}
          </KeywordShardProvider>
        </LibraryArticle>
      </ArticleMetadataProvider>
    </>
  );
}
