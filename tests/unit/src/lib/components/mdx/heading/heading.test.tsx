/**
 * Heading Component Unit Tests
 *
 * @fileoverview Tests for semantic HTML heading components with auto-anchor generation.
 * Validates heading rendering, anchor slug generation, and heading level correctness.
 *
 * @module tests/unit/lib/components/mdx/heading/heading
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react React Testing Library
 * @requires @/lib/components/mdx/heading/heading Module under test
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { H1, H2, H3, H4, H5, H6 } from '@/lib/components/mdx/heading/heading';

describe('Heading Components', () => {
  describe('H1', () => {
    it('should render h1 element', () => {
      render(<H1>Test Heading</H1>);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeDefined();
    });

    it('should render children text', () => {
      render(<H1>My Title</H1>);

      const heading = screen.getByText('My Title');
      expect(heading).toBeDefined();
    });

    it('should generate data-anchor from text content', () => {
      const { container } = render(<H1>Test Heading</H1>);

      const heading = container.querySelector('[data-anchor]');
      expect(heading?.getAttribute('data-anchor')).toBe('test-heading');
    });
  });

  describe('H2', () => {
    it('should render h2 element', () => {
      render(<H2>Section Heading</H2>);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeDefined();
    });
  });

  describe('H3', () => {
    it('should render h3 element', () => {
      render(<H3>Subsection</H3>);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeDefined();
    });
  });

  describe('H4', () => {
    it('should render h4 element', () => {
      render(<H4>Minor Heading</H4>);

      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toBeDefined();
    });
  });

  describe('H5', () => {
    it('should render h5 element', () => {
      render(<H5>Small Heading</H5>);

      const heading = screen.getByRole('heading', { level: 5 });
      expect(heading).toBeDefined();
    });
  });

  describe('H6', () => {
    it('should render h6 element', () => {
      render(<H6>Tiny Heading</H6>);

      const heading = screen.getByRole('heading', { level: 6 });
      expect(heading).toBeDefined();
    });
  });

  describe('anchor generation', () => {
    it('should convert spaces to hyphens', () => {
      const { container } = render(<H2>Multiple Word Title</H2>);

      const heading = container.querySelector('[data-anchor]');
      expect(heading?.getAttribute('data-anchor')).toBe('multiple-word-title');
    });

    it('should convert to lowercase', () => {
      const { container } = render(<H2>UPPERCASE TITLE</H2>);

      const heading = container.querySelector('[data-anchor]');
      expect(heading?.getAttribute('data-anchor')).toBe('uppercase-title');
    });

    it('should remove special characters', () => {
      const { container } = render(<H2>Title! With? Punctuation.</H2>);

      const heading = container.querySelector('[data-anchor]');
      expect(heading?.getAttribute('data-anchor')).toBe('title-with-punctuation');
    });

    it('should use custom anchor when provided', () => {
      const { container } = render(<H2 anchor="custom-anchor">Title</H2>);

      const heading = container.querySelector('[data-anchor]');
      expect(heading?.getAttribute('data-anchor')).toBe('custom-anchor');
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const { container } = render(<H2 className="custom-class">Title</H2>);

      const heading = container.querySelector('.custom-class');
      expect(heading).toBeDefined();
    });
  });
});
