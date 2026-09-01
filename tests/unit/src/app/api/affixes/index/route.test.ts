/**
 * @fileoverview Tests for Affixes Index API Route
 * @module tests/unit/src/app/api/affixes/index/route.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires next/server
 * @requires @/app/api/affixes/index/route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/affixes/index/route';

describe('Affixes Index API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('GET', () => {
    it('should be defined as an async function', () => {
      expect(GET).toBeDefined();
      expect(GET).toBeInstanceOf(Function);
    });

    it('should return all affixes with default locale', async () => {
      const request = new NextRequest('http://localhost/api/affixes/index');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(9);
    });

    it('should include all expected affix slugs', async () => {
      const request = new NextRequest('http://localhost/api/affixes/index');

      const response = await GET(request);
      const data = await response.json();

      const slugs = data.map((a: { slug: string }) => a.slug);
      expect(slugs).toContain('bloodthirsty');
      expect(slugs).toContain('championed');
      expect(slugs).toContain('crusading');
      expect(slugs).toContain('flametongued');
      expect(slugs).toContain('frostveined');
      expect(slugs).toContain('psionic');
      expect(slugs).toContain('rakish');
      expect(slugs).toContain('stormbound');
      expect(slugs).toContain('sulphurous');
    });

    it('should return correct structure for each affix', async () => {
      const request = new NextRequest('http://localhost/api/affixes/index');

      const response = await GET(request);
      const data = await response.json();

      data.forEach((affix: { slug: string; title: string; link: string }) => {
        expect(affix).toHaveProperty('slug');
        expect(affix).toHaveProperty('title');
        expect(affix).toHaveProperty('link');
        expect(typeof affix.slug).toBe('string');
        expect(typeof affix.title).toBe('string');
        expect(typeof affix.link).toBe('string');
      });
    });

    it('should generate correct wiki links', async () => {
      const request = new NextRequest('http://localhost/api/affixes/index');

      const response = await GET(request);
      const data = await response.json();

      data.forEach((affix: { slug: string; link: string }) => {
        expect(affix.link).toBe(
          `/library/rules/heroic-awakening/${affix.slug}`
        );
      });
    });

    it('should accept locale query parameter', async () => {
      const request = new NextRequest(
        'http://localhost/api/affixes/index?locale=es'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(9);
    });

    it('should use en as default locale when not specified', async () => {
      const request = new NextRequest('http://localhost/api/affixes/index');

      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should have titles matching slug capitalization', async () => {
      const request = new NextRequest('http://localhost/api/affixes/index');

      const response = await GET(request);
      const data = await response.json();

      data.forEach((affix: { slug: string; title: string }) => {
        expect(affix.title.toLowerCase()).toBe(affix.slug);
      });
    });

    it('should return consistent data on multiple calls', async () => {
      const request1 = new NextRequest('http://localhost/api/affixes/index');
      const request2 = new NextRequest('http://localhost/api/affixes/index');

      const response1 = await GET(request1);
      const response2 = await GET(request2);

      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(data1).toEqual(data2);
    });
  });
});
