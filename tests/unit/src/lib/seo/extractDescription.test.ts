/**
 * @fileoverview Tests for the MDX prose description extractor.
 *
 * @module tests/unit/src/lib/seo/extractDescription.test
 */
import { extractDescriptionFromMdx } from '@/lib/seo/extractDescription';
import { describe, expect, it } from 'vitest';

describe('extractDescriptionFromMdx', () => {
  it('extracts the first prose paragraph that meets the minimum length', () => {
    const content =
      '# Title\n\nA first paragraph of prose content that is long enough to qualify.\n\n## Section\n\nMore content here.';
    expect(extractDescriptionFromMdx(content)).toBe(
      'A first paragraph of prose content that is long enough to qualify.',
    );
  });

  it('skips heading lines', () => {
    const content =
      '# Title\n\n## Subtitle\n\nActual prose paragraph that is certainly long enough to be included here.';
    const result = extractDescriptionFromMdx(content);
    expect(result).toContain('Actual prose paragraph');
  });

  it('skips JSX component lines', () => {
    const content =
      '<Image src="/test.webp" alt="test" />\n\nProse paragraph with enough content to pass the length check here.';
    expect(extractDescriptionFromMdx(content)).toContain('Prose paragraph');
  });

  it('strips YAML frontmatter before extracting', () => {
    const content =
      '---\ntitle: Test\n---\n\nProse paragraph with enough content to pass the minimum length threshold for extraction.';
    const result = extractDescriptionFromMdx(content);
    expect(result).not.toContain('title:');
    expect(result).toContain('Prose paragraph');
  });

  it('truncates descriptions exceeding 160 characters', () => {
    const long = 'A'.repeat(200);
    const content = `# Title\n\n${long}`;
    const result = extractDescriptionFromMdx(content);
    expect(result?.length).toBeLessThanOrEqual(160);
    expect(result?.endsWith('...')).toBe(true);
  });

  it('returns null when no prose paragraph is found', () => {
    const content = '# Title\n\n## Subtitle\n\n---\n';
    expect(extractDescriptionFromMdx(content)).toBeNull();
  });

  it('extracts description from heirloom-style MDX with JSX components at top', () => {
    const content = [
      '# Dreaded Defender',
      '',
      "<ParallaxBackdrop src='/library/images/heirlooms/dreaded-defender-background.webp' />",
      '',
      "<FloatedContainer side='right' width='50%'>",
      "  <Image src='/library/images/heirlooms/dreaded-defender.webp' alt='Dreaded Defender' />",
      '</FloatedContainer>',
      '',
      '_Legendary (requires attunement)_',
      '',
      'A dense, blackened medallion of an unknown alloy, warm to the touch and heavy far beyond its size.',
    ].join('\n');
    const result = extractDescriptionFromMdx(content);
    expect(result).toContain('dense, blackened medallion');
  });
});
