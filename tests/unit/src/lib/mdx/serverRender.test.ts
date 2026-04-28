import { renderToHtml } from '@/lib/mdx/serverRender';
import React from 'react';
import { describe, expect, it } from 'vitest';

describe('serverRender', () => {
  it('renders a simple React node to HTML', () => {
    const html = renderToHtml({
      content: React.createElement('div', null, 'hello'),
    });
    expect(html).toContain('hello');
  });
});
