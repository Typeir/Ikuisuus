/**
 * @fileoverview Tests for Single Affix API Route
 * @module tests/unit/src/app/api/affixes/[slug]/route
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/app/api/affixes/[slug]/route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/affixes/[slug]/route';

describe('Single Affix API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('GET', () => {
    it('should be defined as an async function', () => {
      expect(GET).toBeDefined();
      expect(GET).toBeInstanceOf(Function);
    });

    it('should return affix data for valid slug', async () => {
      const request = new Request('http://localhost/api/affixes/bloodthirsty');
      const context = { params: Promise.resolve({ slug: 'bloodthirsty' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.slug).toBe('bloodthirsty');
      expect(data.title).toBe('Bloodthirsty');
      expect(data.link).toBe('/library/rules/heroic-awakening/bloodthirsty');
    });

    it('should return 404 for non-existent affix', async () => {
      const request = new Request(
        'http://localhost/api/affixes/nonexistent-affix'
      );
      const context = { params: Promise.resolve({ slug: 'nonexistent-affix' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Affix not found');
    });

    it('should return correct structure for championed', async () => {
      const request = new Request('http://localhost/api/affixes/championed');
      const context = { params: Promise.resolve({ slug: 'championed' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(data).toEqual({
        slug: 'championed',
        title: 'Championed',
        link: '/library/rules/heroic-awakening/championed',
      });
    });

    it('should return correct structure for crusading', async () => {
      const request = new Request('http://localhost/api/affixes/crusading');
      const context = { params: Promise.resolve({ slug: 'crusading' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(data).toEqual({
        slug: 'crusading',
        title: 'Crusading',
        link: '/library/rules/heroic-awakening/crusading',
      });
    });

    it('should return correct structure for flametongued', async () => {
      const request = new Request('http://localhost/api/affixes/flametongued');
      const context = { params: Promise.resolve({ slug: 'flametongued' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(data.slug).toBe('flametongued');
      expect(data.title).toBe('Flametongued');
    });

    it('should return correct structure for frostveined', async () => {
      const request = new Request('http://localhost/api/affixes/frostveined');
      const context = { params: Promise.resolve({ slug: 'frostveined' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(data.slug).toBe('frostveined');
      expect(data.title).toBe('Frostveined');
    });

    it('should return correct structure for psionic', async () => {
      const request = new Request('http://localhost/api/affixes/psionic');
      const context = { params: Promise.resolve({ slug: 'psionic' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(data.slug).toBe('psionic');
      expect(data.title).toBe('Psionic');
    });

    it('should return correct structure for rakish', async () => {
      const request = new Request('http://localhost/api/affixes/rakish');
      const context = { params: Promise.resolve({ slug: 'rakish' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(data.slug).toBe('rakish');
      expect(data.title).toBe('Rakish');
    });

    it('should return correct structure for stormbound', async () => {
      const request = new Request('http://localhost/api/affixes/stormbound');
      const context = { params: Promise.resolve({ slug: 'stormbound' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(data.slug).toBe('stormbound');
      expect(data.title).toBe('Stormbound');
    });

    it('should return correct structure for sulphurous', async () => {
      const request = new Request('http://localhost/api/affixes/sulphurous');
      const context = { params: Promise.resolve({ slug: 'sulphurous' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(data.slug).toBe('sulphurous');
      expect(data.title).toBe('Sulphurous');
    });

    it('should accept locale query parameter', async () => {
      const request = new Request(
        'http://localhost/api/affixes/bloodthirsty?locale=es'
      );
      const context = { params: Promise.resolve({ slug: 'bloodthirsty' }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.slug).toBe('bloodthirsty');
    });

    it('should use en as default locale', async () => {
      const request = new Request('http://localhost/api/affixes/bloodthirsty');
      const context = { params: Promise.resolve({ slug: 'bloodthirsty' }) };

      const response = await GET(request, context);

      expect(response.status).toBe(200);
    });

    it('should be case-sensitive for slug matching', async () => {
      const request = new Request('http://localhost/api/affixes/Bloodthirsty');
      const context = { params: Promise.resolve({ slug: 'Bloodthirsty' }) };

      const response = await GET(request, context);

      expect(response.status).toBe(404);
    });

    it('should return JSON content type', async () => {
      const request = new Request('http://localhost/api/affixes/bloodthirsty');
      const context = { params: Promise.resolve({ slug: 'bloodthirsty' }) };

      const response = await GET(request, context);

      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });
});
