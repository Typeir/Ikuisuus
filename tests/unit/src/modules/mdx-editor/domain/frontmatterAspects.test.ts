/**
 * @fileoverview Frontmatter Aspects Tests
 * @description Read/write of the `aspects:` list in YAML frontmatter.
 *
 * @module tests/unit/src/modules/mdx-editor/domain/frontmatterAspects
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import {
  readFrontmatterAspects,
  writeFrontmatterAspects,
} from '@/modules/mdx-editor/domain/frontmatterAspects';
import { describe, expect, it } from 'vitest';

const DOC = `---
source: Ikuisuus
contentType: spells
aspects:
  - form:blade
  - myth:dreamcatcher
denyAspects:
  - damage:fire
---

# Bolt
`;

describe('readFrontmatterAspects', () => {
  it('should read a block list', () => {
    expect(readFrontmatterAspects(DOC)).toEqual(['form:blade', 'myth:dreamcatcher']);
  });

  it('should read a flow list', () => {
    expect(
      readFrontmatterAspects('---\naspects: [form:hand, "myth:sun"]\n---\n# X'),
    ).toEqual(['form:hand', 'myth:sun']);
  });

  it('should return empty without frontmatter or key', () => {
    expect(readFrontmatterAspects('# X')).toEqual([]);
    expect(readFrontmatterAspects('---\nsource: a\n---\n# X')).toEqual([]);
  });
});

describe('writeFrontmatterAspects', () => {
  it('should replace an existing block and keep neighbours', () => {
    const out = writeFrontmatterAspects(DOC, ['form:hand']);
    expect(out).toBe(`---
source: Ikuisuus
contentType: spells
aspects:
  - form:hand
denyAspects:
  - damage:fire
---

# Bolt
`);
  });

  it('should append the key when frontmatter has none', () => {
    const out = writeFrontmatterAspects('---\nsource: a\n---\n\n# X\n', ['myth:sun']);
    expect(out).toBe('---\nsource: a\naspects:\n  - myth:sun\n---\n\n# X\n');
  });

  it('should remove the key when the list is empty', () => {
    const out = writeFrontmatterAspects(DOC, []);
    expect(out).not.toContain('aspects:');
    expect(out).toContain('denyAspects:');
    expect(readFrontmatterAspects(out)).toEqual([]);
  });

  it('should create frontmatter when the buffer has none', () => {
    expect(writeFrontmatterAspects('# X\n', ['form:blade'])).toBe(
      '---\naspects:\n  - form:blade\n---\n\n# X\n',
    );
  });

  it('should round-trip through read', () => {
    const out = writeFrontmatterAspects(DOC, ['a:b', 'c:d', 'e:f']);
    expect(readFrontmatterAspects(out)).toEqual(['a:b', 'c:d', 'e:f']);
  });
});
