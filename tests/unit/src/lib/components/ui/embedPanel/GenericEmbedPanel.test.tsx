/**
 * @fileoverview Generic Embed Panel Tests
 * @description Unit tests for the generic embed panel component.
 * Tests positioning, drag handle, closing, iframe rendering, and prop passing.
 *
 * @module tests/unit/src/lib/components/ui/embedPanel/GenericEmbedPanel.test
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { GenericEmbedPanel } from '@/lib/components/ui/embedPanel/GenericEmbedPanel';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('GenericEmbedPanel', () => {
  it('renders drag handle with correct label', () => {
    render(
      <GenericEmbedPanel
        url='world/test'
        locale='en'
        initialPosition={() => ({ x: 0, y: 0 })}
        handleLabel='My Panel'
        testId='test-panel'
      />,
    );

    expect(screen.getByText('My Panel')).toBeInTheDocument();
  });

  it('renders testId on the draggable container', () => {
    render(
      <GenericEmbedPanel
        url='world/test'
        locale='en'
        initialPosition={() => ({ x: 0, y: 0 })}
        handleLabel='Test Panel'
        testId='my-test-panel'
      />,
    );

    expect(screen.getByTestId('my-test-panel')).toBeInTheDocument();
  });

  it('calls onClosed when close button is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <GenericEmbedPanel
        url='world/test'
        locale='en'
        initialPosition={() => ({ x: 0, y: 0 })}
        handleLabel='Test Panel'
        onClosed={handleClose}
        testId='test-panel'
      />,
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(handleClose).toHaveBeenCalled();
  });

  it('applies custom contentRole and contentAriaLabel', () => {
    render(
      <GenericEmbedPanel
        url='world/test'
        locale='en'
        initialPosition={() => ({ x: 0, y: 0 })}
        handleLabel='Test Panel'
        contentRole='region'
        contentAriaLabel='Custom Region'
      />,
    );

    const contentWrapper = screen.getByRole('region');
    expect(contentWrapper).toHaveAttribute('aria-label', 'Custom Region');
  });

  it('renders iframe with embed URL from url and locale', () => {
    render(
      <GenericEmbedPanel
        url='world/test-body'
        locale='en'
        initialPosition={() => ({ x: 0, y: 0 })}
        handleLabel='Test Panel'
        iframeTitle='Test Embed'
      />,
    );

    const iframe = screen.getByTitle('Test Embed') as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toContain('/en/library/world/test-body?embed=true');
  });

  it('renders null iframe src when url is null', () => {
    render(
      <GenericEmbedPanel
        url={null}
        locale='en'
        initialPosition={() => ({ x: 0, y: 0 })}
        handleLabel='Test Panel'
        iframeTitle='Null Embed'
      />,
    );

    const iframe = screen.getByTitle('Null Embed') as HTMLIFrameElement;
    // When src is undefined, JSDOM returns '' (browsers return 'about:blank')
    expect(iframe.src).toBe('');
  });

  it('accepts custom testId and contentAriaLabel together', () => {
    render(
      <GenericEmbedPanel
        url='world/test'
        locale='en'
        initialPosition={() => ({ x: 0, y: 0 })}
        handleLabel='Test Panel'
        resizable={true}
        testId='custom-panel'
        contentAriaLabel='Custom Area'
      />,
    );

    const panel = screen.getByTestId('custom-panel');
    expect(panel).toBeInTheDocument();
    const content = screen.getByRole('complementary', { name: 'Custom Area' });
    expect(content).toBeInTheDocument();
  });
});

