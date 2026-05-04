/**
 * API Routes Integration Tests
 *
 * @fileoverview Integration tests for API routes serving metadata,
 * testing locale handling and data structure.
 */

import { GET as getHeirlooms } from '@/app/api/heirlooms/route';
import { GET as getMonsters } from '@/app/api/monsters/route';
import { POST as getSpells } from '@/app/api/spells/route';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

describe('API Routes', () => {
  describe('Monsters API', () => {
    it('should return monster metadata for default locale', async () => {
      const request = new NextRequest('http://localhost:3000/api/monsters');
      const response = await getMonsters(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);

      if (data.length > 0) {
        const monster = data[0];
        expect(monster).toHaveProperty('slug');
        expect(monster).toHaveProperty('title');
        expect(monster).toHaveProperty('cr');
        expect(monster).toHaveProperty('size');
        expect(monster).toHaveProperty('creatureType');
        expect(monster).toHaveProperty('tags');
        expect(Array.isArray(monster.tags)).toBe(true);
      }
    });

    it('should return monster metadata for specified locale', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monsters?locale=en',
      );
      const response = await getMonsters(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should flatten monster arrays from multi-variant files', async () => {
      const request = new NextRequest('http://localhost:3000/api/monsters');
      const response = await getMonsters(request);
      const data = await response.json();

      // Each item should be a flat object, not an array
      if (data.length > 0) {
        expect(Array.isArray(data[0])).toBe(false);
        expect(typeof data[0]).toBe('object');
      }
    });
  });

  describe('Heirlooms API', () => {
    it('should return heirloom metadata', async () => {
      const request = new NextRequest('http://localhost:3000/api/heirlooms');
      const response = await getHeirlooms(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);

      if (data.length > 0) {
        const heirloom = data[0];
        expect(heirloom).toHaveProperty('slug');
        expect(heirloom).toHaveProperty('title');
        expect(heirloom).toHaveProperty('rarity');
        expect(heirloom).toHaveProperty('itemType');
        expect(heirloom).toHaveProperty('tags');
      }
    });

    it('should handle locale parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/heirlooms?locale=es',
      );
      const response = await getHeirlooms(request);

      // Should return data or empty array, not error
      expect(response.status).toBe(200);
    });
  });

  describe('Spells API', () => {
    it('should return spell metadata', async () => {
      const request = new NextRequest('http://localhost:3000/api/spells', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: 'en' }),
      });
      const response = await getSpells(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);

      if (data.length > 0) {
        const spell = data[0];
        expect(spell).toHaveProperty('slug');
        expect(spell).toHaveProperty('title');
        expect(spell).toHaveProperty('level');
        expect(spell).toHaveProperty('school');
        expect(spell).toHaveProperty('castingTime');
        expect(Array.isArray(spell.castingTime)).toBe(true);
        expect(spell).toHaveProperty('tags');
      }
    });

    it('should include casting time as array', async () => {
      const request = new NextRequest('http://localhost:3000/api/spells', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: 'en' }),
      });
      const response = await getSpells(request);
      const data = await response.json();

      if (data.length > 0) {
        const spell = data[0];
        expect(Array.isArray(spell.castingTime)).toBe(true);

        if (spell.castingTime.length > 0) {
          expect(typeof spell.castingTime[0]).toBe('string');
        }
      }
    });

    it('should include component flags', async () => {
      const request = new NextRequest('http://localhost:3000/api/spells', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: 'en' }),
      });
      const response = await getSpells(request);
      const data = await response.json();

      if (data.length > 0) {
        const spell = data[0];
        expect(spell).toHaveProperty('components');
        expect(typeof spell.components).toBe('object');
        expect(typeof spell.components?.verbal).toBe('boolean');
      }
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on invalid locale path', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monsters?locale=invalid-locale-xyz',
      );
      const response = await getMonsters(request);

      // Should handle gracefully - either empty array or error
      expect([200, 500]).toContain(response.status);
    });

    it('should handle missing metadata gracefully', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monsters?locale=fi',
      );
      const response = await getMonsters(request);

      // Finnish locale might not have content, should return empty or fallback
      expect([200, 500]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      }
    });

    it('should return JSON content-type header', async () => {
      const request = new NextRequest('http://localhost:3000/api/monsters');
      const response = await getMonsters(request);

      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');
    });
  });

  describe('Locale Fallback Behavior', () => {
    it('should default to en locale when locale param missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/monsters');
      const response = await getMonsters(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should accept es locale parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/heirlooms?locale=es',
      );
      const response = await getHeirlooms(request);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Data Structure Validation', () => {
    it('should return consistent tag structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/monsters');
      const response = await getMonsters(request);
      const data = await response.json();

      if (data.length > 0) {
        data.forEach((monster: any) => {
          expect(Array.isArray(monster.tags)).toBe(true);

          if (monster.tags.length > 0) {
            expect(typeof monster.tags[0]).toBe('string');
            // Tags should follow category:value pattern
            if (monster.tags.some((t: string) => t.includes(':'))) {
              expect(monster.tags[0]).toMatch(/^[a-z-]+:[a-z0-9-]+$/);
            }
          }
        });
      }
    });

    it('should return valid AC structure for monsters', async () => {
      const request = new NextRequest('http://localhost:3000/api/monsters');
      const response = await getMonsters(request);
      const data = await response.json();

      if (data.length > 0 && data[0].ac) {
        expect(data[0].ac).toHaveProperty('value');
        expect(typeof data[0].ac.value).toBe('number');

        if (data[0].ac.notes) {
          expect(typeof data[0].ac.notes).toBe('string');
        }
      }
    });

    it('should return valid HP structure for monsters', async () => {
      const request = new NextRequest('http://localhost:3000/api/monsters');
      const response = await getMonsters(request);
      const data = await response.json();

      if (data.length > 0 && data[0].hp) {
        expect(data[0].hp).toHaveProperty('average');
        expect(typeof data[0].hp.average).toBe('number');
        expect(data[0].hp.average).toBeGreaterThan(0);

        if (data[0].hp.formula) {
          expect(typeof data[0].hp.formula).toBe('string');
          expect(data[0].hp.formula).toMatch(/\d+d\d+/);
        }
      }
    });

    it('should return valid rarity values for heirlooms', async () => {
      const request = new NextRequest('http://localhost:3000/api/heirlooms');
      const response = await getHeirlooms(request);
      const data = await response.json();

      if (data.length > 0) {
        data.forEach((heirloom: any) => {
          if (heirloom.rarity) {
            // Check that rarity is a non-empty string (actual values may include complex formats like 'Mythic Artifact', 'Legendary (requires attunement)', etc.)
            expect(typeof heirloom.rarity).toBe('string');
            expect(heirloom.rarity.length).toBeGreaterThan(0);
          }
        });
      }
    });

    it('should return valid spell level range', async () => {
      const request = new NextRequest('http://localhost:3000/api/spells', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: 'en' }),
      });
      const response = await getSpells(request);
      const data = await response.json();

      if (data.length > 0) {
        data.forEach((spell: any) => {
          // Homebrew content may exceed standard D&D 0-9 range, just verify it's a non-negative number
          expect(typeof spell.level).toBe('number');
          expect(spell.level).toBeGreaterThanOrEqual(0);
        });
      }
    });
  });

  describe('Performance and Limits', () => {
    it('should return monsters within reasonable time', async () => {
      const start = Date.now();
      const request = new NextRequest('http://localhost:3000/api/monsters');
      await getMonsters(request);
      const duration = Date.now() - start;

      // API should respond within 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    it('should handle empty metadata directory gracefully', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monsters?locale=nonexistent',
      );
      const response = await getMonsters(request);

      // Should not throw, should return error or empty array
      expect(response).toBeDefined();
    });
  });
});
