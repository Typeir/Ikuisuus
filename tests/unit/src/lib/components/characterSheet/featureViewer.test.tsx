/**
 * @fileoverview FeatureViewer Unit Tests
 * @description Tests for the FeatureViewer component.
 *
 * @module tests/unit/lib/components/characterSheet/featureViewer
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { FeatureViewer } from '@/lib/components/characterSheet/featureViewer';
import type { CharacterShard } from '@/lib/types/character';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.stubGlobal('fetch', vi.fn());

const VOCATION_FEATURES: CharacterShard[] = [
  {
    id: 'wiz::Arcane Recovery',
    sourceFile: 'vocations/wizard.mdx',
    heading: 'Arcane Recovery',
    category: 'vocation-feature',
    level: 1,
    cachedText: 'Recover spent spell slots.',
  },
];

const SPEC_FEATURES: CharacterShard[] = [
  {
    id: 'evoker::Sculpt Spells',
    sourceFile: 'vocations/wizard/evoker.mdx',
    heading: 'Sculpt Spells',
    category: 'specialization-feature',
    level: 2,
    cachedText: 'Protect allies from your evocations.',
  },
];

describe('FeatureViewer', () => {
  it('renders both section headings', () => {
    render(
      <FeatureViewer
        vocationFeatures={VOCATION_FEATURES}
        specializationFeatures={SPEC_FEATURES}
        characterLevel={5}
      />,
    );
    expect(screen.getByText('vocationFeatures')).toBeTruthy();
    expect(screen.getByText('specializationFeatures')).toBeTruthy();
  });

  it('renders feature headings', () => {
    render(
      <FeatureViewer
        vocationFeatures={VOCATION_FEATURES}
        specializationFeatures={SPEC_FEATURES}
        characterLevel={5}
      />,
    );
    expect(screen.getByText('Arcane Recovery')).toBeTruthy();
    expect(screen.getByText('Sculpt Spells')).toBeTruthy();
  });

  it('shows "No features selected" message for empty sections', () => {
    render(
      <FeatureViewer
        vocationFeatures={[]}
        specializationFeatures={[]}
        characterLevel={1}
      />,
    );
    expect(screen.getAllByText('noFeaturesSelected')).toHaveLength(2);
  });

  it('accepts custom section titles', () => {
    render(
      <FeatureViewer
        vocationFeatures={[]}
        specializationFeatures={[]}
        characterLevel={1}
        vocationTitle='My Vocation'
        specializationTitle='My Spec'
      />,
    );
    expect(screen.getByText('My Vocation')).toBeTruthy();
    expect(screen.getByText('My Spec')).toBeTruthy();
  });

  it('marks features above character level as locked', () => {
    const highLevelFeature: CharacterShard = {
      id: 'wiz::High Level',
      sourceFile: 'f.mdx',
      heading: 'High Level Feature',
      category: 'vocation-feature',
      level: 10,
      cachedText: 'Only at level 10.',
    };
    render(
      <FeatureViewer
        vocationFeatures={[highLevelFeature]}
        specializationFeatures={[]}
        characterLevel={5}
      />,
    );
    const lockedWrapper = screen
      .getByText('High Level Feature')
      .closest('[aria-disabled="true"]');
    expect(lockedWrapper).toBeTruthy();
  });
});
