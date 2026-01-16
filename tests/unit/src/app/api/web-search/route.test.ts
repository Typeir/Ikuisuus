/**
 * @fileoverview Tests for Web Search API Route
 * @module tests/unit/src/app/api/web-search/route
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires next/server
 * @requires @/app/api/web-search/route
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/web-search/route';
import { logger } from '@/lib/logging/logger';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Web Search API Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      GOOGLE_API_KEY: 'test-api-key',
      GOOGLE_CX: 'test-cx-id',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('GET', () => {
    it('should be defined as an async function', () => {
      expect(GET).toBeDefined();
      expect(GET).toBeInstanceOf(Function);
    });

    it('should return empty items when no query provided', async () => {
      const request = new NextRequest('http://localhost/api/web-search');

      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({ items: [] });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should call Google API with correct parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });

      const request = new NextRequest('http://localhost/api/web-search?q=dragon');
      await GET(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://www.googleapis.com/customsearch/v1')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('q=dragon')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('key=test-api-key')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('cx=test-cx-id')
      );
    });

    it('should return search results from Google API', async () => {
      const mockItems = [
        { title: 'Dragons', link: 'https://example.com/dragons' },
        { title: 'Dragon Types', link: 'https://example.com/types' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: mockItems }),
      });

      const request = new NextRequest('http://localhost/api/web-search?q=dragon');
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual(mockItems);
    });

    it('should return empty array when API returns no items', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const request = new NextRequest('http://localhost/api/web-search?q=nonexistent');
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      const request = new NextRequest('http://localhost/api/web-search?q=dragon');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({ items: [] });
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const request = new NextRequest('http://localhost/api/web-search?q=dragon');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ items: [] });
    });

    it('should URL encode the search query', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });

      const request = new NextRequest('http://localhost/api/web-search?q=dragon%20fire');
      await GET(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('dragon%20fire')
      );
    });

    it('should handle special characters in query', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });

      const request = new NextRequest('http://localhost/api/web-search?q=d%26d+monster');
      await GET(request);

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle empty query string', async () => {
      const request = new NextRequest('http://localhost/api/web-search?q=');

      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({ items: [] });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const request = new NextRequest('http://localhost/api/web-search?q=dragon');
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({ items: [] });
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const request = new NextRequest('http://localhost/api/web-search?q=dragon');
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({ items: [] });
    });

    it('should return correct content type', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });

      const request = new NextRequest('http://localhost/api/web-search?q=dragon');
      const response = await GET(request);

      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });
});
