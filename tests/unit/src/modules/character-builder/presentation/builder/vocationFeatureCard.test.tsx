/**
 * @fileoverview VocationFeatureCard Unit Tests
 * @description Tests for the VocationFeatureCard component.
 *
 * @module tests/unit/lib/components/characterSheet/vocationFeatureCard
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { CharacterShard } from '@/lib/types/character';
import { VocationFeatureCard } from '@/modules/character-builder/presentation/builder/vocationFeatureCard';
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

describe('VocationFeatureCard', () => {
  it('renders both section headings', () => {
    render(
      <VocationFeatureCard
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
      <VocationFeatureCard
        vocationFeatures={VOCATION_FEATURES}
        specializationFeatures={SPEC_FEATURES}
        characterLevel={5}
      />,
    );
    expect(screen.getByText('Arcane Recovery')).toBeTruthy();
    expect(screen.getByText('Sculpt Spells')).toBeTruthy();
  });

  it('shows "No selection" messages when no selection and empty arrays', () => {
    render(
      <VocationFeatureCard
        vocationFeatures={[]}
        specializationFeatures={[]}
        characterLevel={1}
      />,
    );
    expect(screen.getByText('noVocationSelected')).toBeTruthy();
    expect(screen.getByText('noSpecializationSelected')).toBeTruthy();
  });

  it('shows "No features available" when selection made but arrays are empty', () => {
    render(
      <VocationFeatureCard
        vocationFeatures={[]}
        specializationFeatures={[]}
        characterLevel={1}
        hasVocation
        hasSpecialization
      />,
    );
    expect(screen.getAllByText('noFeaturesSelected')).toHaveLength(2);
  });

  it('accepts custom section titles', () => {
    render(
      <VocationFeatureCard
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

  it('renders features above character level as locked (not hidden)', () => {
    const highLevelFeature: CharacterShard = {
      id: 'wiz::High Level',
      sourceFile: 'f.mdx',
      heading: 'High Level Feature',
      category: 'vocation-feature',
      level: 10,
      cachedText: 'Only at level 10.',
    };
    render(
      <VocationFeatureCard
        vocationFeatures={[highLevelFeature]}
        specializationFeatures={[]}
        characterLevel={5}
        hasVocation
      />,
    );
    // Locked features still render their heading
    expect(screen.getByText('High Level Feature')).toBeTruthy();
  });
});
