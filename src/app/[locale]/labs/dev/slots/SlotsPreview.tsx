/**
 * @fileoverview Slot card fixture preview.
 * @description Renders the heirloom fixture through the real wiki article
 * frame so the card can be eyeballed against the live article while the slot
 * components are worked on. The fixture uses the default spelling
 * (attributes); the element form is exercised by the unit tests. Mounted at
 * `/labs/dev/slots` and on the `/labs/dev` canvas.
 *
 * @module app/[locale]/labs/dev/slots/SlotsPreview
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-03
 */

import { readFileSync } from 'fs';
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
 * Slug of the production article the fixture restructures; the preview borrows
 * its metadata, aspects, and stream text so the frame matches the live page.
 */
const ARTICLE_SLUG = ['items', 'heirlooms', 'alfanjon-of-the-crescent-moon'];

/**
 * Fixture path.
 */
export const FIXTURE = path.resolve('tests/fixtures/slots', 'alfanjon.mdx');

/**
 * Renders the heirloom fixture inside the article frame.
 *
 * @returns {Promise<React.ReactElement>} Rendered fixture
 */
export async function SlotsPreview(): Promise<React.ReactElement> {
  const source = readFileSync(FIXTURE, 'utf8');

  const streamText = await resolveStreamText('en', ARTICLE_SLUG, source);
  const articleMetadata = await loadArticleMetadata(ARTICLE_SLUG, 'en');

  const result = await compileStatic({
    source,
    components: { ...enrichedComponents, ...slotComponents },
    baseUrl: pathToFileURL(FIXTURE).toString(),
    aspects: aspectIndexOf(articleMetadata),
    attributeRewrite: true,
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
