/**
 * @fileoverview Heading Components with Auto-Generated Anchors
 * @description Heading components that generate anchor slugs for hash navigation.
 *
 * @module heading
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { JSX } from 'react';
import React, { ReactNode } from 'react';

/**
 * Converts text to a lowercase, hyphen-separated URL-safe slug.
 *
 * @param {string} text - The heading text to convert
 * @returns {string} Slug-formatted string (lowercase, hyphen-separated)
 *
 * @example
 * textToSlug('My Awesome Heading!');
 * // Returns: 'my-awesome-heading'
 *
 * @example
 * textToSlug('  Multiple   Spaces  ');
 * // Returns: 'multiple-spaces'
 */
function textToSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w\-]/g, '') // Remove non-word characters except hyphens
    .replace(/\-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^\-+|\-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Recursively extracts text content from React children.
 *
 * @param {ReactNode} children - React children to extract text from
 * @returns {string} Concatenated text content
 *
 * @example
 * getTextFromChildren('Simple text');
 * // Returns: 'Simple text'
 *
 * @example
 * getTextFromChildren(<span>Bold <strong>text</strong></span>);
 * // Returns: 'Bold text'
 */
function getTextFromChildren(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(getTextFromChildren).join('');
  }
  if (
    React.isValidElement<{ children?: ReactNode }>(children) &&
    children.props.children
  ) {
    return getTextFromChildren(children.props.children);
  }
  return '';
}

/**
 * Wraps the first character of the first text node in a span with className 'first-letter'.
 *
 * Recursively walks nested elements to locate the first text node and wraps its
 * first character in `<span className="first-letter">`.
 *
 * @param {ReactNode} children - Content to process
 * @returns {ReactNode} Children with first letter wrapped in <span>
 *
 * @example
 * wrapFirstLetterInHeading('Hello world');
 * // Returns: <><span className="first-letter">H</span>ello world</>
 *
 * @example
 * wrapFirstLetterInHeading(<strong>Bold</strong>);
 * // Returns: <strong><span className="first-letter">B</span>old</strong>
 */
function wrapFirstLetterInHeading(children: ReactNode): ReactNode {
  const text = getTextFromChildren(children);
  if (!text) return children;

  const firstChar = text[0];
  const rest = text.slice(1);

  if (typeof children === 'string') {
    return (
      <>
        <span className='first-letter'>{firstChar}</span>
        {rest}
      </>
    );
  }

  if (Array.isArray(children)) {
    const modified = [...children];
    for (let i = 0; i < modified.length; i++) {
      const child = modified[i];
      if (typeof child === 'string' && child.trim()) {
        modified[i] = (
          <React.Fragment key={`first-letter-${i}`}>
            <span className='first-letter'>{child[0]}</span>
            {child.slice(1)}
          </React.Fragment>
        );
        return modified;
      }
      if (React.isValidElement(child)) {
        modified[i] = React.cloneElement(
          child,
          { key: (child as any).key ?? `heading-child-${i}` },
          wrapFirstLetterInHeading(
            (child.props as { children: ReactNode }).children,
          ),
        );
        return modified;
      }
    }
    return children;
  }

  if (React.isValidElement(children)) {
    return React.cloneElement(
      children,
      {},
      wrapFirstLetterInHeading(
        (children.props as { children: ReactNode }).children,
      ),
    );
  }

  return children;
}

/**
 * Props for the Heading component.
 *
 * @property {1 | 2 | 3 | 4 | 5 | 6} level - HTML heading level (h1-h6)
 * @property {ReactNode} children - Heading content (text or React elements)
 * @property {string} [anchor] - Custom anchor slug (auto-generated if omitted)
 * @property {string} [className] - Additional CSS classes to apply
 */
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children?: ReactNode;
  anchor?: string;
  className?: string;
}

/**
 * Renders a semantic heading element with an auto-generated data-anchor attribute.
 *
 * Extracts text from children, converts it to a slug, and sets it as data-anchor
 * unless a custom anchor is provided. Wraps the first letter in a span.
 *
 * @param {HeadingProps} props - Component props
 * @param {1 | 2 | 3 | 4 | 5 | 6} props.level - HTML heading level
 * @param {ReactNode} props.children - Heading content
 * @param {string} [props.anchor] - Custom anchor (overrides auto-generation)
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} Heading element with data-anchor attribute
 *
 * @remarks
 * Uses `data-anchor` instead of `id` to avoid HTML uniqueness constraints.
 * Works with `HashNavigationProvider` for automatic scroll-to-anchor behavior.
 *
 * @example
 * <Heading level={2}>My Section Title</Heading>
 * // Renders: <h2 data-anchor="my-section-title">My Section Title</h2>
 *
 * @example
 * // With custom anchor:
 * <Heading level={3} anchor="custom-slug">Complex <em>Formatted</em> Title</Heading>
 * // Renders: <h3 data-anchor="custom-slug">Complex <em>Formatted</em> Title</h3>
 *
 * @example
 * // Navigate programmatically:
 * window.location.hash = '#my-section-title';
 * // With HashNavigationProvider, will scroll to the heading
 */
export function Heading({
  level,
  children,
  anchor,
  className,
}: HeadingProps): JSX.Element {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const headingText = getTextFromChildren(children);
  const headingAnchor = anchor || textToSlug(headingText);
  const wrappedChildren = wrapFirstLetterInHeading(children);

  const props = {
    'data-anchor': headingAnchor,
    className,
  };

  return React.createElement(Tag, props, wrappedChildren);
}

/**
 * Creates a memoized heading component for a fixed heading level.
 *
 * @param {1 | 2 | 3 | 4 | 5 | 6} level - HTML heading level
 * @returns {React.FC<Omit<HeadingProps, 'level'>>} A heading component for the specified level
 *
 * @remarks
 * Uses React.memo. The fixed level is set on the Heading component.
 *
 * @example
 * const H1 = createHeadingComponent(1);
 * <H1>Main Title</H1>
 * // Renders: <h1 data-anchor="main-title">Main Title</h1>
 */
function createHeadingComponent(
  level: 1 | 2 | 3 | 4 | 5 | 6,
): React.FC<Omit<HeadingProps, 'level'>> {
  const HeadingComponent = React.memo(
    ({ children, anchor, className }: Omit<HeadingProps, 'level'>) => (
      <Heading level={level} anchor={anchor} className={className}>
        {children}
      </Heading>
    ),
  );

  HeadingComponent.displayName = `H${level}`;
  return HeadingComponent;
}

/**
 * H1 heading component with auto-generated data-anchor.
 *
 * @example
 * <H1>Main Title</H1>
 * // Renders: <h1 data-anchor="main-title">Main Title</h1>
 */
export const H1 = createHeadingComponent(1);

/**
 * H2 heading component with auto-generated data-anchor.
 *
 * @example
 * <H2>Section Title</H2>
 * // Renders: <h2 data-anchor="section-title">Section Title</h2>
 */
export const H2 = createHeadingComponent(2);

/**
 * H3 heading component with auto-generated data-anchor.
 *
 * @example
 * <H3>Subsection Title</H3>
 * // Renders: <h3 data-anchor="subsection-title">Subsection Title</h3>
 */
export const H3 = createHeadingComponent(3);

/**
 * H4 heading component with auto-generated data-anchor.
 *
 * @example
 * <H4>Detail Section</H4>
 * // Renders: <h4 data-anchor="detail-section">Detail Section</h4>
 */
export const H4 = createHeadingComponent(4);

/**
 * H5 heading component with auto-generated data-anchor.
 *
 * @example
 * <H5>Subdetail Heading</H5>
 * // Renders: <h5 data-anchor="subdetail-heading">Subdetail Heading</h5>
 */
export const H5 = createHeadingComponent(5);

/**
 * H6 heading component with auto-generated data-anchor.
 *
 * @example
 * <H6>Minor Heading</H6>
 * // Renders: <h6 data-anchor="minor-heading">Minor Heading</h6>
 */
export const H6 = createHeadingComponent(6);
