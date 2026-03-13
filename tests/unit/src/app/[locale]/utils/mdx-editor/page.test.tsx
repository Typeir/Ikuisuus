/**
 * MDX Editor Page Unit Tests
 *
 * @fileoverview Tests for the MDX Editor tool page server component.
 *
 * @module tests/unit/app/[locale]/utils/mdx-editor/page
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/components/mdxEditor/mdxEditor', () => ({
  MdxEditor: ({ locale }: { locale: string }) => (
    <div data-testid='mdx-editor' data-locale={locale} />
  ),
}));
vi.mock('./page.module.scss', () => ({
  default: { editorPage: 'editorPage' },
}));

import MdxEditorPage, {
    generateMetadata,
} from '@/app/[locale]/utils/mdx-editor/page';

describe('MdxEditorPage', () => {
  it('should generate metadata with title', () => {
    const metadata = generateMetadata();
    expect(metadata.title).toBe('MDX Editor | Library of Ikuisuus');
  });

  it('should render with locale from params', async () => {
    const element = await MdxEditorPage({
      params: Promise.resolve({ locale: 'en' }),
    });

    expect(element).toBeDefined();
  });
});
