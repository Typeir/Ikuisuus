import { draftRepository } from '@/lib/db/content/repositories/draftRepository';
import { persistDraft } from '@/modules/mdx-editor/application/use-cases/persistDraft';
import { describe, expect, it, vi } from 'vitest';

describe('persistDraft', () => {
  it('delegates to draftRepository.upsert', async () => {
    const spy = vi.spyOn(draftRepository, 'upsert').mockResolvedValue({
      id: '1',
    } as never);

    await persistDraft({ locale: 'en', slug: 'world/test', content: '# Test' });

    expect(spy).toHaveBeenCalledWith({
      locale: 'en',
      slug: 'world/test',
      content: '# Test',
    });
  });
});
